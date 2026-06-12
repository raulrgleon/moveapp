import type { MoveProfile } from "@/lib/move-profile";
import { fetchOsrmRoute, type GeoPoint, type RouteGeometry } from "@/lib/geo/coordinates";

export interface RouteStats {
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  stopCount: number;
  geometry?: RouteGeometry;
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

export async function computeRouteStats(
  from: GeoPoint,
  to: GeoPoint,
  hasPets = false
): Promise<RouteStats | null> {
  const route = await fetchOsrmRoute(from, to);
  if (!route) return null;

  return {
    distanceMiles: Math.round(route.distanceMiles),
    durationHours: route.durationHours,
    driveTimeLabel: formatDriveTime(route.durationHours),
    stopCount: estimateStopCount(route.distanceMiles, route.durationHours, hasPets),
    geometry: route,
  };
}

export async function resolveRouteDistanceMiles(
  profile: MoveProfile,
  destLat?: number,
  destLon?: number
): Promise<number | undefined> {
  const points = resolveRoutePoints(profile, destLat, destLon);
  if (!points) return undefined;
  const stats = await computeRouteStats(points.from, points.to, profile.pets);
  return stats?.distanceMiles;
}
