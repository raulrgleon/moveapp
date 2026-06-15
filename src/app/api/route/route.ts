import { NextRequest, NextResponse } from "next/server";
import { fetchRouteStops } from "@/lib/geo/route-stops";
import {
  computeRouteStatsWithAlternatives,
  formatDriveTime,
  resolveRoutePoints,
} from "@/lib/geo/route-service";

function parseCoord(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
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

  try {
    const stats = await computeRouteStatsWithAlternatives(points.from, points.to, hasPets);
    if (!stats) {
      return NextResponse.json({ error: "Could not compute route" }, { status: 502 });
    }

    const routeIndex = Math.max(0, parseInt(params.get("routeIndex") ?? "0", 10) || 0);
    const selected = stats.alternatives[routeIndex] ?? stats.alternatives[0];

    const stops = await fetchRouteStops(
      {
        distanceMiles: Math.round(selected.distanceMiles),
        durationHours: selected.durationHours,
        driveTimeLabel: stats.driveTimeLabel,
        stopCount: stats.stopCount,
        geometry: selected,
      },
      profile
    );

    const alternatives = stats.alternatives.map((alt) => ({
      index: alt.index,
      distanceMiles: Math.round(alt.distanceMiles),
      durationHours: alt.durationHours,
      driveTimeLabel: formatDriveTime(alt.durationHours),
      coordinates: alt.coordinates,
    }));

    return NextResponse.json({
      distanceMiles: Math.round(selected.distanceMiles),
      durationHours: selected.durationHours,
      driveTimeLabel: stats.driveTimeLabel,
      stopCount: stats.stopCount,
      stops,
      alternatives,
      selectedRouteIndex: routeIndex,
    });
  } catch (error) {
    console.error("GET /api/route error:", error);
    return NextResponse.json({ error: "Failed to compute route" }, { status: 500 });
  }
}
