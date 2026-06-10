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

/** Fetch driving route via OSRM (OpenStreetMap routing, free). */
export async function fetchOsrmRoute(
  from: GeoPoint,
  to: GeoPoint
): Promise<RouteGeometry | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    const coords = route.geometry.coordinates as [number, number][];
    return {
      coordinates: coords,
      distanceMiles: route.distance / 1609.34,
      durationHours: route.duration / 3600,
    };
  } catch {
    return null;
  }
}
