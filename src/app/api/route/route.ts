import { NextRequest, NextResponse } from "next/server";
import { fetchRouteStops } from "@/lib/geo/route-stops";
import {
  estimateStopCount,
  formatDriveTime,
  resolveRoutePoints,
} from "@/lib/geo/route-service";
import { fetchOsrmRoutes, type RouteAlternative } from "@/lib/geo/coordinates";
import { simplifyRouteCoordinates } from "@/lib/geo/simplify-coordinates";

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
  }));
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

    const selected = alternatives[routeIndex] ?? alternatives[0];
    const stopCount = estimateStopCount(
      selected.distanceMiles,
      selected.durationHours,
      hasPets
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

    const stops = await fetchRouteStops(
      {
        distanceMiles: Math.round(selected.distanceMiles),
        durationHours: selected.durationHours,
        driveTimeLabel,
        stopCount,
        geometry: selected,
      },
      profile
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
