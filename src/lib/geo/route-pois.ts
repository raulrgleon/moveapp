import { estimateHotelNightlyRate } from "@/lib/budget/hotel-cost";
import { gasPriceForLocation, fetchLiveRegularGasPrice } from "@/lib/budget/gas-prices";

const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilotai.com)";

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

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

/** Interpolate a point at `targetMiles` along a GeoJSON line. */
export function pointAlongRouteByMiles(
  coordinates: [number, number][],
  targetMiles: number
): { lat: number; lon: number } | null {
  if (coordinates.length < 2) return null;

  let accumulated = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lon0, lat0] = coordinates[i - 1];
    const [lon1, lat1] = coordinates[i];
    const seg = haversineMiles({ lat: lat0, lon: lon0 }, { lat: lat1, lon: lon1 });
    if (accumulated + seg >= targetMiles) {
      const frac = seg > 0 ? (targetMiles - accumulated) / seg : 0;
      return {
        lat: lat0 + frac * (lat1 - lat0),
        lon: lon0 + frac * (lon1 - lon0),
      };
    }
    accumulated += seg;
  }

  const [lon, lat] = coordinates[coordinates.length - 1];
  return { lat, lon };
}

function elementCoords(el: OverpassElement): { lat: number; lon: number } | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lon: el.lon };
  if (el.center) return el.center;
  return null;
}

function formatOsmName(tags: Record<string, string>, fallback: string): string {
  return tags.name?.trim() || tags.brand?.trim() || tags.operator?.trim() || fallback;
}

function formatOsmAddress(tags: Record<string, string>): string {
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"];
  const parts = [street, city, tags["addr:state"], tags["addr:postcode"]].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return tags["addr:full"]?.trim() || "";
}

function isPetFriendly(tags: Record<string, string>): boolean {
  const petTags = [tags.dog, tags.pets, tags.pets_allowed, tags["pets:dogs"]];
  return petTags.some((v) => v === "yes" || v === "allowed");
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function queryOverpass(ql: string): Promise<OverpassElement[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(ql)}`,
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch {
      /* try next mirror */
    }
  }
  return [];
}

export function distanceMilesBetween(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  return haversineMiles(a, b);
}

async function reverseGeocodeLabel(lat: number, lon: number): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    // Building/street zoom so hotels get a street address, not just the city.
    url.searchParams.set("zoom", "18");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return "";
    const data = (await res.json()) as {
      address?: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        suburb?: string;
        state?: string;
        postcode?: string;
      };
    };
    const a = data.address;
    if (!a) return "";
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    const city = a.city || a.town || a.village || a.municipality || a.suburb;
    return [street, city, a.state, a.postcode].filter(Boolean).join(", ");
  } catch {
    return "";
  }
}

async function resolveLocation(
  tags: Record<string, string>,
  lat: number,
  lon: number
): Promise<string> {
  const fromTags = formatOsmAddress(tags);
  if (fromTags) return fromTags;
  const reversed = await reverseGeocodeLabel(lat, lon);
  if (reversed) return reversed;
  const city = tags["addr:city"] || tags["addr:town"];
  if (city && tags["addr:state"]) return `${city}, ${tags["addr:state"]}`;
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function pickClosestNamed(
  elements: OverpassElement[],
  lat: number,
  lon: number,
  usedIds: Set<string>,
  options?: { preferPetFriendly?: boolean; fallbackName?: string }
): OverpassElement | null {
  const preferPetFriendly = options?.preferPetFriendly ?? false;
  const fallbackName = options?.fallbackName ?? "Place";
  const candidates = elements
    .map((el) => {
      const coords = elementCoords(el);
      if (!coords || !el.tags) return null;
      const id = `${el.type}/${el.id}`;
      if (usedIds.has(id)) return null;
      const name = formatOsmName(el.tags, fallbackName);
      if (!name) return null;
      const dist = haversineMiles({ lat, lon }, coords);
      const petScore = preferPetFriendly && isPetFriendly(el.tags) ? 0 : preferPetFriendly ? 5 : 0;
      return { el, dist: dist + petScore, id, coords };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.dist - b.dist);

  return candidates[0]?.el ?? null;
}

export async function fetchNearbyGasStation(
  lat: number,
  lon: number,
  usedIds: Set<string>,
  liveGasPrice?: number
): Promise<{
  name: string;
  location: string;
  lat: number;
  lon: number;
  osmId: string;
  gasPricePerGallon: number;
} | null> {
  const ql = `[out:json][timeout:15];
(
  nwr["amenity"="fuel"](around:12000,${lat},${lon});
);
out center tags 8;`;

  const elements = await queryOverpass(ql);
  const picked = pickClosestNamed(elements, lat, lon, usedIds, {
    fallbackName: "Gas station",
  });
  if (!picked?.tags) return null;

  const coords = elementCoords(picked)!;
  const osmId = `${picked.type}/${picked.id}`;
  usedIds.add(osmId);

  const location = await resolveLocation(picked.tags, coords.lat, coords.lon);
  const live = liveGasPrice ?? (await fetchLiveRegularGasPrice());
  const gasPricePerGallon = await gasPriceForLocation(location, live);

  return {
    name: formatOsmName(picked.tags, "Gas station"),
    location,
    lat: coords.lat,
    lon: coords.lon,
    osmId,
    gasPricePerGallon,
  };
}

export async function fetchNearbyHotel(
  lat: number,
  lon: number,
  usedIds: Set<string>,
  petFriendly: boolean
): Promise<{
  name: string;
  location: string;
  lat: number;
  lon: number;
  osmId: string;
  petFriendly: boolean;
  estimatedPrice: number;
  tags: Record<string, string>;
} | null> {
  const ql = `[out:json][timeout:18];
(
  nwr["tourism"~"hotel|motel|guest_house|hostel"](around:25000,${lat},${lon});
  nwr["tourism"="hotel"]["addr:street"](around:25000,${lat},${lon});
);
out center tags 16;`;

  const elements = await queryOverpass(ql);
  const picked = pickClosestNamed(elements, lat, lon, usedIds, {
    preferPetFriendly: petFriendly,
    fallbackName: petFriendly ? "Pet-friendly hotel" : "Hotel",
  });
  if (!picked?.tags) return null;

  const coords = elementCoords(picked)!;
  const osmId = `${picked.type}/${picked.id}`;
  usedIds.add(osmId);
  const location = await resolveLocation(picked.tags, coords.lat, coords.lon);
  const isPet = isPetFriendly(picked.tags);

  return {
    name: formatOsmName(picked.tags, petFriendly ? "Pet-friendly hotel" : "Hotel"),
    location,
    lat: coords.lat,
    lon: coords.lon,
    osmId,
    petFriendly: isPet,
    estimatedPrice: estimateHotelNightlyRate(picked.tags, location, petFriendly && isPet),
    tags: picked.tags,
  };
}

function restAreaScore(tags: Record<string, string>): number {
  if (tags.highway === "rest_area") return 0;
  if (tags.highway === "services") return 1;
  if (tags.amenity === "fuel") return 2;
  return 99;
}

export type RestBreakPoiKind = "rest_area" | "services" | "gas_station";

export interface RestBreakPoi {
  name: string;
  location: string;
  lat: number;
  lon: number;
  osmId: string;
  kind: RestBreakPoiKind;
}

function classifyRestBreakKind(tags: Record<string, string>): RestBreakPoiKind | null {
  if (tags.highway === "rest_area") return "rest_area";
  if (tags.highway === "services") return "services";
  if (tags.amenity === "fuel") return "gas_station";
  return null;
}

function formatRestBreakTitle(
  tags: Record<string, string>,
  kind: RestBreakPoiKind,
  locale: "en" | "es"
): string {
  const place = formatOsmName(tags, "");
  const brand = tags.brand?.trim() || tags.operator?.trim() || place;
  if (locale === "es") {
    switch (kind) {
      case "rest_area":
        return brand ? `Área de descanso — ${brand}` : "Área de descanso en carretera";
      case "services":
        return brand ? `Área de servicio — ${brand}` : "Área de servicio en carretera";
      case "gas_station":
        return brand ? `Gasolinera — ${brand}` : "Gasolinera con baños";
    }
  }
  switch (kind) {
    case "rest_area":
      return brand ? `Rest area — ${brand}` : "Highway rest area";
    case "services":
      return brand ? `Service area — ${brand}` : "Highway service area";
    case "gas_station":
      return brand ? `Gas station — ${brand}` : "Gas station with restrooms";
  }
}

async function queryRestBreakCandidates(
  lat: number,
  lon: number,
  radiusMeters: number,
  usedRestOsmIds: Set<string>,
  locale: "en" | "es"
): Promise<RestBreakPoi | null> {
  const ql = `[out:json][timeout:18];
(
  nwr["highway"="rest_area"](around:${radiusMeters},${lat},${lon});
  nwr["highway"="services"](around:${radiusMeters},${lat},${lon});
  nwr["amenity"="fuel"](around:${Math.min(radiusMeters, 20000)},${lat},${lon});
);
out center tags 12;`;

  const elements = await queryOverpass(ql);
  const origin = { lat, lon };

  const candidates = elements
    .map((el) => {
      const coords = elementCoords(el);
      if (!coords || !el.tags) return null;
      const kind = classifyRestBreakKind(el.tags);
      if (!kind) return null;
      const osmId = `${el.type}/${el.id}`;
      if (usedRestOsmIds.has(osmId)) return null;
      const dist = haversineMiles(origin, coords);
      return { el, coords, tags: el.tags, kind, osmId, dist };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort(
      (a, b) =>
        restAreaScore(a.tags) - restAreaScore(b.tags) || a.dist - b.dist
    );

  const picked = candidates[0];
  if (!picked) return null;

  usedRestOsmIds.add(picked.osmId);
  const location = await resolveLocation(picked.tags, picked.coords.lat, picked.coords.lon);

  return {
    name: formatRestBreakTitle(picked.tags, picked.kind, locale),
    location,
    lat: picked.coords.lat,
    lon: picked.coords.lon,
    osmId: picked.osmId,
    kind: picked.kind,
  };
}

/** Search along the route for a real rest area or gas station (expanding radius & mile offsets). */
export async function fetchRestBreakForRouteMile(
  coordinates: [number, number][],
  targetMile: number,
  usedRestOsmIds: Set<string>,
  locale: "en" | "es" = "en"
): Promise<RestBreakPoi | null> {
  const mileOffsets = [0, -4, 4, -8, 8, -14, 14, -22, 22];
  const radiiMeters = [10_000, 18_000, 28_000, 40_000];

  for (const offset of mileOffsets) {
    const mile = Math.max(1, targetMile + offset);
    const point = pointAlongRouteByMiles(coordinates, mile);
    if (!point) continue;

    for (const radius of radiiMeters) {
      const poi = await queryRestBreakCandidates(
        point.lat,
        point.lon,
        radius,
        usedRestOsmIds,
        locale
      );
      if (poi) return poi;
    }
  }

  return null;
}

/** @deprecated Use fetchRestBreakForRouteMile */
export async function fetchNearbyRestArea(
  lat: number,
  lon: number,
  usedIds: Set<string>
): Promise<{
  name: string;
  location: string;
  lat: number;
  lon: number;
  osmId: string;
} | null> {
  const poi = await queryRestBreakCandidates(lat, lon, 18_000, usedIds, "en");
  return poi;
}
