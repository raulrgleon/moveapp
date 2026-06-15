import { NextRequest, NextResponse } from "next/server";
import { fetchOsrmRoutes, type GeoPoint } from "@/lib/geo/coordinates";
import { fetchCurrentWeather } from "@/lib/weather/weatherapi";
import { samplePointsAlongRoute, weatherSampleCount } from "@/lib/weather/route-sampling";

function parseCoord(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: NextRequest) {
  if (!process.env.WEATHERAPI_KEY) {
    return NextResponse.json({ error: "Weather API not configured" }, { status: 500 });
  }

  const originLat = parseCoord(req.nextUrl.searchParams.get("originLat"));
  const originLon = parseCoord(req.nextUrl.searchParams.get("originLon"));
  const destLat = parseCoord(req.nextUrl.searchParams.get("destLat"));
  const destLon = parseCoord(req.nextUrl.searchParams.get("destLon"));

  if (
    originLat == null ||
    originLon == null ||
    destLat == null ||
    destLon == null
  ) {
    return NextResponse.json({ error: "origin and destination coordinates required" }, { status: 400 });
  }

  const origin: GeoPoint = {
    lat: originLat,
    lon: originLon,
    label: req.nextUrl.searchParams.get("originLabel") ?? "Origin",
  };
  const destination: GeoPoint = {
    lat: destLat,
    lon: destLon,
    label: req.nextUrl.searchParams.get("destLabel") ?? "Destination",
  };

  try {
    const routeIndex = Math.max(
      0,
      parseInt(req.nextUrl.searchParams.get("routeIndex") ?? "0", 10) || 0
    );
    const routes = await fetchOsrmRoutes(origin, destination, 3);
    const route = routes[routeIndex] ?? routes[0];
    if (!route?.coordinates.length) {
      return NextResponse.json({ points: [] });
    }

    const sampleCount = weatherSampleCount(route.distanceMiles);
    const sampled = samplePointsAlongRoute(route.coordinates, sampleCount);

    const weatherResults = await Promise.all(
      sampled.map(async (pt) => {
        const snap = await fetchCurrentWeather(`${pt.lat},${pt.lon}`);
        if (!snap) return null;
        return {
          lat: pt.lat,
          lon: pt.lon,
          location: snap.location,
          tempF: snap.tempF,
          condition: snap.condition,
          icon: snap.icon,
        };
      })
    );

    return NextResponse.json({
      points: weatherResults.filter((p): p is NonNullable<typeof p> => p !== null),
      sampleCount,
    });
  } catch (error) {
    console.error("Along-route weather error:", error);
    return NextResponse.json({ error: "Failed to fetch route weather" }, { status: 500 });
  }
}
