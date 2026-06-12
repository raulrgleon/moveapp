import { NextRequest, NextResponse } from "next/server";
import { fetchRouteStops } from "@/lib/geo/route-stops";
import { computeRouteStats, resolveRoutePoints } from "@/lib/geo/route-service";

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

  const points = resolveRoutePoints(
    {
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
    },
    destinationLat,
    destinationLon
  );

  if (!points) {
    return NextResponse.json(
      { error: "Route coordinates required" },
      { status: 400 }
    );
  }

  try {
    const stats = await computeRouteStats(points.from, points.to, hasPets);
    if (!stats) {
      return NextResponse.json({ error: "Could not compute route" }, { status: 502 });
    }

    const stops = await fetchRouteStops(stats, {
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
    });

    return NextResponse.json({
      distanceMiles: stats.distanceMiles,
      durationHours: stats.durationHours,
      driveTimeLabel: stats.driveTimeLabel,
      stopCount: stats.stopCount,
      stops,
    });
  } catch (error) {
    console.error("GET /api/route error:", error);
    return NextResponse.json({ error: "Failed to compute route" }, { status: 500 });
  }
}
