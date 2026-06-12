import type { MoveDayForecast, WeatherAlert, WeatherSnapshot } from "@/lib/weather/types";

const BASE = "https://api.weatherapi.com/v1";

function iconUrl(path: string): string {
  if (path.startsWith("//")) return `https:${path}`;
  return path;
}

interface CurrentResponse {
  location: { name: string; region: string };
  current: {
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: { text: string; icon: string; code: number };
    wind_mph: number;
    humidity: number;
  };
}

interface ForecastDay {
  date: string;
  day: {
    maxtemp_f: number;
    mintemp_f: number;
    maxwind_mph: number;
    condition: { text: string; icon: string; code: number };
    daily_chance_of_rain: number;
  };
}

interface ForecastResponse {
  location: { name: string; region: string };
  forecast: { forecastday: ForecastDay[] };
}

function getApiKey(): string {
  const key = process.env.WEATHERAPI_KEY;
  if (!key) throw new Error("WEATHERAPI_KEY not configured");
  return key;
}

export function formatWeatherQuery(
  city?: string | null,
  lat?: number | null,
  lon?: number | null
): string | null {
  if (lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
    return `${lat},${lon}`;
  }
  const q = city?.trim();
  return q || null;
}

export async function fetchCurrentWeather(query: string): Promise<WeatherSnapshot | null> {
  const key = getApiKey();
  const url = `${BASE}/current.json?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&aqi=no`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = (await res.json()) as CurrentResponse;
    return {
      location: data.location.name,
      region: data.location.region,
      tempF: Math.round(data.current.temp_f),
      tempC: Math.round(data.current.temp_c),
      condition: data.current.condition.text,
      icon: iconUrl(data.current.condition.icon),
      windMph: Math.round(data.current.wind_mph),
      humidity: data.current.humidity,
      isDay: data.current.is_day === 1,
    };
  } catch {
    return null;
  }
}

export async function fetchForecastForDate(
  query: string,
  targetDate: string
): Promise<MoveDayForecast | null> {
  const key = getApiKey();
  const url = `${BASE}/forecast.json?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&days=14&aqi=no&alerts=no`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as ForecastResponse;
    const day = data.forecast.forecastday.find((d) => d.date === targetDate);
    if (!day) return null;

    return {
      date: day.date,
      location: data.location.name,
      maxTempF: Math.round(day.day.maxtemp_f),
      minTempF: Math.round(day.day.mintemp_f),
      condition: day.day.condition.text,
      icon: iconUrl(day.day.condition.icon),
      chanceOfRain: day.day.daily_chance_of_rain,
      maxWindMph: Math.round(day.day.maxwind_mph),
    };
  } catch {
    return null;
  }
}

const STORM_CODES = new Set([
  1087, 1273, 1276, 1279, 1282, 1192, 1243, 1246, 1240, 1063, 1180, 1183, 1186, 1189, 1195,
]);

export function buildWeatherAlerts(
  snapshots: { label: string; weather: WeatherSnapshot | null; forecast?: MoveDayForecast | null }[]
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  for (const { label, weather, forecast } of snapshots) {
    if (forecast && forecast.chanceOfRain >= 60) {
      alerts.push({
        location: label,
        severity: forecast.chanceOfRain >= 80 ? "warning" : "info",
        message: `${forecast.chanceOfRain}% chance of rain on move day (${forecast.condition.toLowerCase()}). High ${forecast.maxTempF}°F, low ${forecast.minTempF}°F.`,
      });
    }
    if (weather) {
      const lower = weather.condition.toLowerCase();
      if (
        lower.includes("thunder") ||
        lower.includes("storm") ||
        lower.includes("heavy rain") ||
        lower.includes("blizzard") ||
        lower.includes("ice")
      ) {
        alerts.push({
          location: label,
          severity: lower.includes("thunder") || lower.includes("storm") ? "warning" : "info",
          message: `Currently ${weather.condition.toLowerCase()} in ${weather.location} (${weather.tempF}°F, wind ${weather.windMph} mph).`,
        });
      }
    }
  }

  return alerts;
}

export function isStormCondition(code?: number): boolean {
  return code !== undefined && STORM_CODES.has(code);
}
