const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilot.ai)";

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

async function queryOverpass(ql: string): Promise<OverpassElement[]> {
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(ql)}`,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { elements?: OverpassElement[] };
    return json.elements ?? [];
  } catch {
    return [];
  }
}

async function reverseGeocodeLabel(lat: number, lon: number): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

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
        state?: string;
        postcode?: string;
      };
    };
    const a = data.address;
    if (!a) return "";
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    const city = a.city || a.town || a.village;
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
  preferPetFriendly = false
): OverpassElement | null {
  const candidates = elements
    .map((el) => {
      const coords = elementCoords(el);
      if (!coords || !el.tags) return null;
      const id = `${el.type}/${el.id}`;
      if (usedIds.has(id)) return null;
      const name = formatOsmName(el.tags, "");
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
  usedIds: Set<string>
): Promise<{ name: string; location: string; lat: number; lon: number; osmId: string } | null> {
  const ql = `[out:json][timeout:15];
(
  nwr["amenity"="fuel"](around:12000,${lat},${lon});
);
out center tags 8;`;

  const elements = await queryOverpass(ql);
  const picked = pickClosestNamed(elements, lat, lon, usedIds);
  if (!picked?.tags) return null;

  const coords = elementCoords(picked)!;
  const osmId = `${picked.type}/${picked.id}`;
  usedIds.add(osmId);

  return {
    name: formatOsmName(picked.tags, "Gas station"),
    location: await resolveLocation(picked.tags, coords.lat, coords.lon),
    lat: coords.lat,
    lon: coords.lon,
    osmId,
  };
}

export async function fetchNearbyHotel(
  lat: number,
  lon: number,
  usedIds: Set<string>,
  petFriendly: boolean
): Promise<{ name: string; location: string; lat: number; lon: number; osmId: string; petFriendly: boolean } | null> {
  const ql = `[out:json][timeout:15];
(
  nwr["tourism"~"hotel|motel"](around:15000,${lat},${lon});
);
out center tags 10;`;

  const elements = await queryOverpass(ql);
  const picked = pickClosestNamed(elements, lat, lon, usedIds, petFriendly);
  if (!picked?.tags) return null;

  const coords = elementCoords(picked)!;
  const osmId = `${picked.type}/${picked.id}`;
  usedIds.add(osmId);

  return {
    name: formatOsmName(picked.tags, petFriendly ? "Pet-friendly hotel" : "Hotel"),
    location: await resolveLocation(picked.tags, coords.lat, coords.lon),
    lat: coords.lat,
    lon: coords.lon,
    osmId,
    petFriendly: isPetFriendly(picked.tags),
  };
}
