import type { MoveProfile } from "@/lib/move-profile";
import {
  fetchOsrmRoute,
  fetchOsrmRoutes,
  type GeoPoint,
  type RouteAlternative,
  type RouteGeometry,
} from "@/lib/geo/coordinates";

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

export function formatDriveTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function estimateStopCount(
  distanceMiles: number,
  durationHours: number,
  hasPets: boolean
): number {
  const gasStops = Math.max(1, Math.floor(distanceMiles / 350));
  const overnight = durationHours > 10 ? Math.ceil(durationHours / 10) - 1 : 0;
  const petStops = hasPets && durationHours > 6 ? 1 : 0;
  return gasStops + overnight + petStops;
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
  const points = resolveRoutePoints(profile, destLat, destLon);
  if (!points) return undefined;

  const alternatives = await fetchOsrmRoutes(points.from, points.to, 3);
  const route = alternatives[routeIndex] ?? alternatives[0];
  return route ? Math.round(route.distanceMiles) : undefined;
}
