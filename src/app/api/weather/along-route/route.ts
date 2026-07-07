import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { fetchOsrmRoutes, type GeoPoint } from "@/lib/geo/coordinates";
import { fetchCurrentWeather } from "@/lib/weather/weatherapi";
import { samplePointsAlongRoute, weatherSampleCount } from "@/lib/weather/route-sampling";
import { enforcePublicRateLimit } from "@/lib/public-api-rate-limit";

function parseCoord(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: NextRequest) {
  const limited = await enforcePublicRateLimit(req, "weather-along-route", 30, 60_000);
  if (limited) return limited;

  if (!process.env.WEATHERAPI_KEY) {
    return jsonErrorFromRequest(req, "configurationMissing", 500);
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

  const coordsParam = req.nextUrl.searchParams.get("coords")?.trim();

  try {
    let routeCoordinates: [number, number][] = [];

    if (coordsParam) {
      routeCoordinates = coordsParam
        .split(";")
        .map((pair) => {
          const [lon, lat] = pair.split(",").map((v) => Number(v.trim()));
          if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
          return [lon, lat] as [number, number];
        })
        .filter((c): c is [number, number] => c !== null);
    }

    if (!routeCoordinates.length) {
      const routeIndex = Math.max(
        0,
        parseInt(req.nextUrl.searchParams.get("routeIndex") ?? "0", 10) || 0
      );
      const routes = await fetchOsrmRoutes(origin, destination, 3);
      const route = routes[routeIndex] ?? routes[0];
      routeCoordinates = route?.coordinates ?? [];
    }

    if (!routeCoordinates.length) {
      return NextResponse.json({ points: [] });
    }

    const parsedDistance = parseFloat(req.nextUrl.searchParams.get("distanceMiles") ?? "");
    const distanceMiles =
      Number.isFinite(parsedDistance) && parsedDistance > 0
        ? parsedDistance
        : routeCoordinates.length > 1
          ? Math.max(50, routeCoordinates.length * 0.5)
          : 50;
    const sampleCount = weatherSampleCount(distanceMiles);
    const sampled = samplePointsAlongRoute(routeCoordinates, sampleCount);

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
    return jsonErrorFromRequest(req, "failed", 500);
  }
}
