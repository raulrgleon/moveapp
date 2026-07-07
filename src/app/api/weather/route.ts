import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import {
  buildWeatherAlerts,
  fetchCurrentWeather,
  fetchForecastForDate,
  formatWeatherQuery,
} from "@/lib/weather/weatherapi";
import type { RouteWeatherResponse } from "@/lib/weather/types";
import { enforcePublicRateLimit } from "@/lib/public-api-rate-limit";

const FORECAST_HORIZON_DAYS = 14;

function daysUntilMove(moveDate: string): number {
  const move = new Date(moveDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  move.setHours(0, 0, 0, 0);
  return Math.ceil((move.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function parseCoord(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: NextRequest) {
  const limited = await enforcePublicRateLimit(req, "weather", 40, 60_000);
  if (limited) return limited;

  if (!process.env.WEATHERAPI_KEY) {
    return jsonErrorFromRequest(req, "configurationMissing", 500);
  }

  const originCity = req.nextUrl.searchParams.get("origin")?.trim() ?? "";
  const destinationCity = req.nextUrl.searchParams.get("destination")?.trim() ?? "";
  const moveDate = req.nextUrl.searchParams.get("moveDate")?.trim();
  const stopsParam = req.nextUrl.searchParams.get("stops")?.trim();
  const originLat = parseCoord(req.nextUrl.searchParams.get("originLat"));
  const originLon = parseCoord(req.nextUrl.searchParams.get("originLon"));
  const destinationLat = parseCoord(req.nextUrl.searchParams.get("destinationLat"));
  const destinationLon = parseCoord(req.nextUrl.searchParams.get("destinationLon"));

  const originQuery = formatWeatherQuery(originCity, originLat, originLon);
  const destinationQuery = formatWeatherQuery(
    destinationCity,
    destinationLat,
    destinationLon
  );

  if (!originQuery || !destinationQuery) {
    return NextResponse.json(
      { error: "origin and destination required" },
      { status: 400 }
    );
  }

  const stopLocations = stopsParam
    ? stopsParam.split("|").map((s) => s.trim()).filter(Boolean)
    : [];

  try {
    const uniqueStops = Array.from(new Set(stopLocations)).slice(0, 4);

    let moveDayForecast = null;
    let forecastNote: string | null = null;

    if (moveDate) {
      const daysOut = daysUntilMove(moveDate);
      if (daysOut > FORECAST_HORIZON_DAYS) {
        forecastNote = `forecast_beyond_${FORECAST_HORIZON_DAYS}:${daysOut}`;
      } else if (daysOut >= 0) {
        moveDayForecast = await fetchForecastForDate(destinationQuery, moveDate);
      }
    }

    const [originWeather, destWeather, ...stopResults] = await Promise.all([
      fetchCurrentWeather(originQuery),
      fetchCurrentWeather(destinationQuery),
      ...uniqueStops.map((loc) => fetchCurrentWeather(loc)),
    ]);

    const stopWeather = stopResults.filter((w): w is NonNullable<typeof w> => w !== null);

    const alerts = buildWeatherAlerts([
      { label: originCity || originQuery, weather: originWeather },
      {
        label: destinationCity || destinationQuery,
        weather: destWeather,
        forecast: moveDayForecast,
      },
      ...uniqueStops.map((loc, i) => ({
        label: loc,
        weather: stopResults[i] ?? null,
      })),
    ]);

    const payload: RouteWeatherResponse = {
      origin: originWeather,
      destination: destWeather,
      moveDayForecast,
      stopWeather,
      alerts,
      forecastNote,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Weather API error:", error);
    return jsonErrorFromRequest(req, "failed", 500);
  }
}
