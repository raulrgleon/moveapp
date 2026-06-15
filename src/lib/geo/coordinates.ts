export interface GeoPoint {
  lat: number;
  lon: number;
  label: string;
}

/** Pre-resolved coordinates for fast map load (no geocoding delay). */
export const MOVE_ROUTE_POINTS = {
  origin: {
    lat: 30.2672,
    lon: -97.7431,
    label: "Austin, TX",
  } satisfies GeoPoint,
  destination: {
    lat: 38.4192,
    lon: -82.4452,
    label: "Huntington, WV",
  } satisfies GeoPoint,
  newHome: {
    lat: 38.4098,
    lon: -82.4165,
    label: "1842 Harper Road, Huntington, WV",
  } satisfies GeoPoint,
};

export interface RouteGeometry {
  coordinates: [number, number][];
  distanceMiles: number;
  durationHours: number;
}

export interface RouteAlternative extends RouteGeometry {
  index: number;
}

const ROUTE_COUNT = 3;

function haversineMiles(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function offsetMidpoint(
  from: GeoPoint,
  to: GeoPoint,
  fraction: number,
  offsetMiles: number,
  side: 1 | -1
): GeoPoint {
  const midLat = from.lat + fraction * (to.lat - from.lat);
  const midLon = from.lon + fraction * (to.lon - from.lon);
  const dLat = to.lat - from.lat;
  const dLon = to.lon - from.lon;
  const len = Math.sqrt(dLat * dLat + dLon * dLon) || 1;
  const perpLat = (-dLon / len) * side;
  const perpLon = (dLat / len) * side;
  const milesToDeg = offsetMiles / 69;
  const cosLat = Math.cos((midLat * Math.PI) / 180);
  return {
    lat: midLat + perpLat * milesToDeg,
    lon: midLon + (perpLon * milesToDeg) / (cosLat || 1),
    label: `Via point ${fraction}`,
  };
}

function parseOsrmRoutes(
  routes: Array<{
    geometry: { coordinates: [number, number][] };
    distance: number;
    duration: number;
  }>
): RouteAlternative[] {
  return routes.map((route, index) => ({
    index,
    coordinates: route.geometry.coordinates,
    distanceMiles: route.distance / 1609.34,
    durationHours: route.duration / 3600,
  }));
}

function routesShareGeometry(a: RouteAlternative, b: RouteAlternative): boolean {
  if (a.coordinates.length !== b.coordinates.length) return false;
  if (a.coordinates.length < 4) return true;
  const midA = a.coordinates[Math.floor(a.coordinates.length / 2)];
  const midB = b.coordinates[Math.floor(b.coordinates.length / 2)];
  return (
    Math.abs(midA[0] - midB[0]) < 0.02 && Math.abs(midA[1] - midB[1]) < 0.02
  );
}

function isDistinctRoute(candidate: RouteAlternative, existing: RouteAlternative[]): boolean {
  for (const route of existing) {
    if (routesShareGeometry(candidate, route)) return false;
    const distDiff = Math.abs(candidate.distanceMiles - route.distanceMiles);
    if (distDiff < Math.max(15, route.distanceMiles * 0.04)) return false;
  }
  return true;
}

async function queryOsrm(coordPath: string): Promise<RouteAlternative[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${coordPath}?overview=full&geometries=geojson&alternatives=${ROUTE_COUNT}`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    const routes = data.routes as Array<{
      geometry: { coordinates: [number, number][] };
      distance: number;
      duration: number;
    }>;
    if (!routes?.length) return [];
    return parseOsrmRoutes(routes);
  } catch {
    return [];
  }
}

async function fetchOsrmThroughWaypoint(
  from: GeoPoint,
  to: GeoPoint,
  waypoint: GeoPoint
): Promise<RouteAlternative | null> {
  const path = `${from.lon},${from.lat};${waypoint.lon},${waypoint.lat};${to.lon},${to.lat}`;
  const routes = await queryOsrm(path);
  return routes[0] ?? null;
}

/** Always returns exactly 3 distinct driving routes when OSRM is reachable. */
export async function fetchOsrmRoutes(
  from: GeoPoint,
  to: GeoPoint,
  _maxAlternatives = ROUTE_COUNT
): Promise<RouteAlternative[]> {
  const directPath = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  let collected: RouteAlternative[] = await queryOsrm(directPath);

  const straightMiles = haversineMiles(from, to);
  const baseOffset = Math.min(120, Math.max(35, straightMiles * 0.07));

  const waypointAttempts: Array<{ fraction: number; offset: number; side: 1 | -1 }> = [
    { fraction: 0.35, offset: baseOffset, side: 1 },
    { fraction: 0.55, offset: baseOffset * 1.25, side: -1 },
    { fraction: 0.45, offset: baseOffset * 0.75, side: 1 },
    { fraction: 0.65, offset: baseOffset * 1.5, side: -1 },
    { fraction: 0.25, offset: baseOffset * 1.1, side: -1 },
    { fraction: 0.75, offset: baseOffset * 0.9, side: 1 },
  ];

  for (const attempt of waypointAttempts) {
    if (collected.length >= ROUTE_COUNT) break;
    const waypoint = offsetMidpoint(from, to, attempt.fraction, attempt.offset, attempt.side);
    const viaRoute = await fetchOsrmThroughWaypoint(from, to, waypoint);
    if (!viaRoute) continue;
    if (!isDistinctRoute(viaRoute, collected)) continue;
    collected.push(viaRoute);
  }

  if (collected.length === 0) {
    collected.push({
      index: 0,
      coordinates: [
        [from.lon, from.lat],
        [to.lon, to.lat],
      ],
      distanceMiles: straightMiles,
      durationHours: straightMiles / 55,
    });
  }

  while (collected.length < ROUTE_COUNT) {
    const attemptIndex = collected.length;
    const scale = 1 + attemptIndex * 0.35;
    const jitter = offsetMidpoint(
      from,
      to,
      0.3 + attemptIndex * 0.15,
      baseOffset * scale,
      attemptIndex % 2 === 0 ? 1 : -1
    );
    const viaRoute = await fetchOsrmThroughWaypoint(from, to, jitter);
    if (viaRoute && isDistinctRoute(viaRoute, collected)) {
      collected.push(viaRoute);
      continue;
    }
    // Last resort: visibly offset midpoint path (never clone route 1 geometry)
    const fallbackWaypoint = offsetMidpoint(
      from,
      to,
      0.5,
      baseOffset * (2 + attemptIndex),
      attemptIndex % 2 === 0 ? -1 : 1
    );
    const fallbackRoute = await fetchOsrmThroughWaypoint(from, to, fallbackWaypoint);
    if (fallbackRoute && isDistinctRoute(fallbackRoute, collected)) {
      collected.push(fallbackRoute);
    }
  }

  return collected.slice(0, ROUTE_COUNT).map((route, index) => ({
    ...route,
    index,
  }));
}

/** Fetch driving route via OSRM (fastest of the three). */
export async function fetchOsrmRoute(
  from: GeoPoint,
  to: GeoPoint
): Promise<RouteGeometry | null> {
  const routes = await fetchOsrmRoutes(from, to, ROUTE_COUNT);
  return routes[0] ?? null;
}

export const REQUIRED_ROUTE_COUNT = ROUTE_COUNT;
