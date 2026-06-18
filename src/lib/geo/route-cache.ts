import type { RouteAlternative } from "@/lib/geo/coordinates";
import type { GeoPoint } from "@/lib/geo/coordinates";

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;

interface CacheEntry {
  expires: number;
  routes: RouteAlternative[];
}

const cache = new Map<string, CacheEntry>();

export function routeCacheKey(from: GeoPoint, to: GeoPoint): string {
  const fmt = (n: number) => n.toFixed(4);
  return `${fmt(from.lat)},${fmt(from.lon)}->${fmt(to.lat)},${fmt(to.lon)}`;
}

export function getCachedRoutes(key: string): RouteAlternative[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.routes.map((route) => ({
    ...route,
    coordinates: route.coordinates.slice(),
  }));
}

export function setCachedRoutes(key: string, routes: RouteAlternative[]): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, {
    expires: Date.now() + TTL_MS,
    routes: routes.map((route) => ({
      ...route,
      coordinates: route.coordinates.slice(),
    })),
  });
}
