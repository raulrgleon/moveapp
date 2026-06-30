import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, requireMoveAccess } from "@/lib/api-auth";
import { loadVehiclesWithMpg } from "@/lib/budget/route-context";
import { fetchRouteStops, type RouteStopsContext } from "@/lib/geo/route-stops";
import {
  estimateStopCount,
  formatDriveTime,
  resolveRoutePoints,
} from "@/lib/geo/route-service";
import { computeFuelStopMarkers } from "@/lib/geo/fuel-stop-planner";
import { fetchOsrmRoutes, type RouteAlternative } from "@/lib/geo/coordinates";
import { simplifyRouteCoordinates } from "@/lib/geo/simplify-coordinates";
import type { RouteStop } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import type { MoveProfile } from "@/lib/move-profile";

function parseCoord(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapAlternativesForClient(alternatives: RouteAlternative[]) {
  return alternatives.map((alt) => ({
    index: alt.index,
    distanceMiles: Math.round(alt.distanceMiles),
    durationHours: alt.durationHours,
    driveTimeLabel: formatDriveTime(alt.durationHours),
    coordinates: simplifyRouteCoordinates(alt.coordinates, 200),
    usesInterstate: alt.usesInterstate,
    interstateRefs: alt.interstateRefs,
  }));
}

async function resolveStopsContext(
  req: NextRequest,
  profile: MoveProfile
): Promise<RouteStopsContext> {
  const session = await getSessionUser(req);
  if (!session) {
    return { rentalPreference: profile.rentalPreference, locale: "en" };
  }

  const accessResult = await requireMoveAccess(req);
  if (accessResult instanceof NextResponse) {
    return {
      rentalPreference: profile.rentalPreference,
      locale: session.locale === "es" ? "es" : "en",
    };
  }

  const { access, user } = accessResult;
  const [vehicles, move] = await Promise.all([
    loadVehiclesWithMpg(access.moveId),
    prisma.move.findUnique({
      where: { id: access.moveId },
      select: { rentalPreference: true },
    }),
  ]);

  return {
    vehicles,
    rentalPreference: move?.rentalPreference ?? profile.rentalPreference,
    vehicleCount: Math.max(1, vehicles.length),
    locale: user.locale === "es" ? "es" : "en",
  };
}

function fuelStopCountForAlt(
  alt: RouteAlternative,
  profile: MoveProfile,
  stopsContext: RouteStopsContext
): number {
  return computeFuelStopMarkers({
    distanceMiles: alt.distanceMiles,
    rentalPreference: stopsContext.rentalPreference ?? profile.rentalPreference,
    vehicles: stopsContext.vehicles,
    vehicleCount: stopsContext.vehicleCount,
  }).length;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const origin = params.get("origin")?.trim() ?? "";
  const destination = params.get("destination")?.trim() ?? "";
  const originLat = parseCoord(params.get("originLat"));
  const originLon = parseCoord(params.get("originLon"));
  const destinationLat = parseCoord(params.get("destinationLat"));
  const destinationLon = parseCoord(params.get("destinationLon"));
  const hasPets = params.get("pets") === "true";
  const stopsOnly = params.get("stopsOnly") === "1";
  const geometryOnly = params.get("geometryOnly") === "1";

  const profile = {
    name: "",
    email: "",
    origin,
    destination,
    moveDate: "",
    household: "",
    pets: hasPets,
    petDetails: "",
    budget: 0,
    rentalPreference: "",
    needsHousingHelp: false,
    needsVehicleTransport: false,
    originLat,
    originLon,
    destinationLat,
    destinationLon,
  };

  const points = resolveRoutePoints(profile, destinationLat, destinationLon);

  if (!points) {
    return NextResponse.json(
      { error: "Route coordinates required" },
      { status: 400 }
    );
  }

  const routeIndex = Math.max(0, parseInt(params.get("routeIndex") ?? "0", 10) || 0);

  try {
    const alternatives = await fetchOsrmRoutes(points.from, points.to, 3);
    if (!alternatives.length) {
      return NextResponse.json({ error: "Could not compute route" }, { status: 502 });
    }

    const stopsContext = await resolveStopsContext(req, profile);

    const selected = alternatives[routeIndex] ?? alternatives[0];
    const stopCount = estimateStopCount(
      selected.distanceMiles,
      selected.durationHours,
      hasPets,
      fuelStopCountForAlt(selected, profile, stopsContext)
    );
    const driveTimeLabel = formatDriveTime(selected.durationHours);

    if (geometryOnly) {
      return NextResponse.json({
        distanceMiles: Math.round(selected.distanceMiles),
        durationHours: selected.durationHours,
        driveTimeLabel,
        stopCount,
        stops: [],
        alternatives: mapAlternativesForClient(alternatives),
        selectedRouteIndex: routeIndex,
      });
    }

    const stopsAll = params.get("stopsAll") === "1";
    if (stopsAll) {
      const stopsByIndex: Record<number, RouteStop[]> = {};
      const stopsResults = await Promise.all(
        alternatives.map(async (alt) => {
          const altStops = await fetchRouteStops(
            {
              distanceMiles: Math.round(alt.distanceMiles),
              durationHours: alt.durationHours,
              driveTimeLabel: formatDriveTime(alt.durationHours),
              stopCount: estimateStopCount(
                alt.distanceMiles,
                alt.durationHours,
                hasPets,
                fuelStopCountForAlt(alt, profile, stopsContext)
              ),
              geometry: alt,
            },
            profile,
            stopsContext
          );
          return { index: alt.index, stops: altStops };
        })
      );
      for (const { index, stops: altStops } of stopsResults) {
        stopsByIndex[index] = altStops;
      }
      return NextResponse.json({
        stopsByIndex,
        selectedRouteIndex: routeIndex,
      });
    }

    const stops = await fetchRouteStops(
      {
        distanceMiles: Math.round(selected.distanceMiles),
        durationHours: selected.durationHours,
        driveTimeLabel,
        stopCount,
        geometry: selected,
      },
      profile,
      stopsContext
    );

    if (stopsOnly) {
      return NextResponse.json({
        stops,
        selectedRouteIndex: routeIndex,
        distanceMiles: Math.round(selected.distanceMiles),
        durationHours: selected.durationHours,
        driveTimeLabel,
        stopCount,
      });
    }

    return NextResponse.json({
      distanceMiles: Math.round(selected.distanceMiles),
      durationHours: selected.durationHours,
      driveTimeLabel,
      stopCount,
      stops,
      alternatives: mapAlternativesForClient(alternatives),
      selectedRouteIndex: routeIndex,
    });
  } catch (error) {
    console.error("GET /api/route error:", error);
    return NextResponse.json({ error: "Failed to compute route" }, { status: 500 });
  }
}
