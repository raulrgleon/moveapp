import type { MoveProfile } from "@/lib/move-profile";
import {
  fetchOsrmRoute,
  fetchOsrmRoutes,
  type GeoPoint,
  type RouteAlternative,
  type RouteGeometry,
} from "@/lib/geo/coordinates";
import { estimateRestBreakCount } from "@/lib/geo/rest-break-planner";
import { parseCityStateLabel, statesMatch } from "@/lib/geo/address-region";
import { searchUsCities } from "@/lib/geo/city-search";

export interface RouteStats {
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  stopCount: number;
  geometry?: RouteGeometry;
}

export interface RouteStatsWithAlternatives extends RouteStats {
  alternatives: RouteAlternative[];
}

const ORIGIN_CITY_CENTER_TTL_MS = 24 * 60 * 60 * 1000;
const originCityCenterCache = new Map<string, { expires: number; point: GeoPoint }>();

export function formatDriveTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Full driving days at ~8h/day (matches meals + hotel estimates). */
export function computeTravelDays(durationHours: number): number {
  if (!Number.isFinite(durationHours) || durationHours <= 0) return 1;
  return Math.max(1, Math.ceil(durationHours / 8));
}

export function estimateStopCount(
  distanceMiles: number,
  durationHours: number,
  hasPets: boolean,
  fuelStopCount?: number
): number {
  const gasStops =
    fuelStopCount != null
      ? fuelStopCount
      : Math.max(1, Math.floor(distanceMiles / 350));
  const overnight = durationHours > 10 ? Math.ceil(durationHours / 10) - 1 : 0;
  const petStops = hasPets && durationHours > 6 ? 1 : 0;
  const restBreaks = estimateRestBreakCount(durationHours);
  return gasStops + overnight + petStops + restBreaks;
}

export function resolveRoutePoints(
  profile: MoveProfile,
  destLat?: number,
  destLon?: number
): { from: GeoPoint; to: GeoPoint } | null {
  const fromLat = profile.originLat;
  const fromLon = profile.originLon;
  const toLat = profile.destinationLat ?? destLat;
  const toLon = profile.destinationLon ?? destLon;

  if (fromLat == null || fromLon == null || toLat == null || toLon == null) {
    return null;
  }

  return {
    from: { lat: fromLat, lon: fromLon, label: profile.origin || "Origin" },
    to: { lat: toLat, lon: toLon, label: profile.destination || "Destination" },
  };
}

async function resolveOriginCityCenter(
  originLabel: string,
  fallback: GeoPoint
): Promise<GeoPoint> {
  const label = originLabel.trim();
  if (label.length < 2) return fallback;

  const cacheKey = label.toLowerCase();
  const cached = originCityCenterCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.point;

  try {
    const results = await searchUsCities(label);
    if (!results.length) return fallback;

    const parsed = parseCityStateLabel(label);
    const cityLower = parsed.city?.trim().toLowerCase();
    const stateValue = parsed.state?.trim();

    const exactCityState = results.find((r) => {
      if (!cityLower || !r.city) return false;
      const cityMatch = r.city.trim().toLowerCase() === cityLower;
      if (!cityMatch) return false;
      if (!stateValue) return true;
      return statesMatch(r.state, stateValue);
    });

    const exactCity = results.find((r) => {
      if (!cityLower || !r.city) return false;
      return r.city.trim().toLowerCase() === cityLower;
    });

    const pick = exactCityState ?? exactCity ?? results[0];
    const point: GeoPoint = {
      lat: pick.lat,
      lon: pick.lon,
      label: pick.displayName || pick.city || label,
    };
    originCityCenterCache.set(cacheKey, {
      expires: Date.now() + ORIGIN_CITY_CENTER_TTL_MS,
      point,
    });
    return point;
  } catch {
    return fallback;
  }
}

/** Same as resolveRoutePoints, but snaps route origin to city center. */
export async function resolveRoutePointsFromCityCenter(
  profile: MoveProfile,
  destLat?: number,
  destLon?: number
): Promise<{ from: GeoPoint; to: GeoPoint } | null> {
  const base = resolveRoutePoints(profile, destLat, destLon);
  if (!base) return null;
  const from = await resolveOriginCityCenter(profile.origin || base.from.label, base.from);
  return { from, to: base.to };
}

function statsFromRoute(route: RouteGeometry, hasPets: boolean): RouteStats {
  return {
    distanceMiles: Math.round(route.distanceMiles),
    durationHours: route.durationHours,
    driveTimeLabel: formatDriveTime(route.durationHours),
    stopCount: estimateStopCount(route.distanceMiles, route.durationHours, hasPets),
    geometry: route,
  };
}

export async function computeRouteStats(
  from: GeoPoint,
  to: GeoPoint,
  hasPets = false
): Promise<RouteStats | null> {
  const route = await fetchOsrmRoute(from, to);
  if (!route) return null;
  return statsFromRoute(route, hasPets);
}

export async function computeRouteStatsWithAlternatives(
  from: GeoPoint,
  to: GeoPoint,
  hasPets = false
): Promise<RouteStatsWithAlternatives | null> {
  const alternatives = await fetchOsrmRoutes(from, to, 3);
  if (!alternatives.length) return null;

  const primary = alternatives[0];
  return {
    ...statsFromRoute(primary, hasPets),
    alternatives,
  };
}

export async function resolveRouteDistanceMiles(
  profile: MoveProfile,
  destLat?: number,
  destLon?: number,
  routeIndex = 0
): Promise<number | undefined> {
  const points = await resolveRoutePointsFromCityCenter(profile, destLat, destLon);
  if (!points) return undefined;

  const alternatives = await fetchOsrmRoutes(points.from, points.to, 3);
  const route = alternatives[routeIndex] ?? alternatives[0];
  return route ? Math.round(route.distanceMiles) : undefined;
}
