import type { AddressSuggestion } from "@/lib/geo/nominatim";
import { statesMatch } from "@/lib/geo/address-region";

const PHOTON_BASE = "https://photon.komoot.io/api/";
/** Continental US + Alaska + Hawaii + Puerto Rico */
const US_BBOX = "-170,18,-65,72";

interface PhotonProperties {
  osm_id?: number;
  osm_type?: string;
  osm_key?: string;
  osm_value?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  type?: string;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProperties;
}

function isUs(props: PhotonProperties): boolean {
  const code = (props.countrycode ?? "").toUpperCase();
  return code === "US" || code === "USA";
}

function localityName(props: PhotonProperties): string {
  return (
    props.name?.trim() ||
    props.city?.trim() ||
    props.town?.trim() ||
    props.village?.trim() ||
    ""
  );
}

function toCitySuggestion(feature: PhotonFeature): AddressSuggestion | null {
  const props = feature.properties;
  const coords = feature.geometry?.coordinates;
  if (!props || !coords || coords.length < 2) return null;
  if (!isUs(props)) return null;

  const city = localityName(props);
  if (!city) return null;

  const state = props.state?.trim() ?? "";
  const [lon, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const osmId = props.osm_id != null ? String(props.osm_id) : `${city}-${state}-${lat}`;
  return {
    placeId: `photon-${osmId}`,
    displayName: state ? `${city}, ${state}, United States` : `${city}, United States`,
    lat,
    lon,
    city,
    state,
    country: "United States",
  };
}

function toAddressSuggestion(feature: PhotonFeature): AddressSuggestion | null {
  const props = feature.properties;
  const coords = feature.geometry?.coordinates;
  if (!props || !coords || coords.length < 2) return null;
  if (!isUs(props)) return null;

  const [lon, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const city =
    props.city?.trim() ||
    props.town?.trim() ||
    props.village?.trim() ||
    props.district?.trim() ||
    props.name?.trim() ||
    "";
  const street = [props.housenumber, props.street].filter(Boolean).join(" ").trim();
  const state = props.state?.trim() ?? "";
  const displayParts = [
    street || props.name,
    city,
    state,
    props.postcode,
    "United States",
  ].filter(Boolean);

  const osmId = props.osm_id != null ? String(props.osm_id) : `${lat},${lon}`;
  return {
    placeId: `photon-${osmId}`,
    displayName: displayParts.join(", "),
    lat,
    lon,
    city: city || undefined,
    state: state || undefined,
    postcode: props.postcode,
    street: street || undefined,
    country: "United States",
  };
}

const PLACE_TAGS = ["place:city", "place:town", "place:village", "place:hamlet"];

async function photonFetch(params: URLSearchParams): Promise<PhotonFeature[]> {
  const url = `${PHOTON_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PhotonFeature[] };
  return data.features ?? [];
}

function rankByQuery(items: AddressSuggestion[], query: string): AddressSuggestion[] {
  const q = query.trim().toLowerCase();
  const score = (item: AddressSuggestion): number => {
    const city = (item.city ?? "").toLowerCase();
    const label = `${city}, ${(item.state ?? "").toLowerCase()}`;
    if (city === q || label === q) return 0;
    if (city.startsWith(q)) return 1;
    if (label.startsWith(q)) return 2;
    if (city.includes(q)) return 3;
    return 4;
  };
  return [...items].sort((a, b) => score(a) - score(b));
}

function dedupeByCityState(items: AddressSuggestion[]): AddressSuggestion[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    const key = `${(s.city ?? "").toLowerCase()}|${(s.state ?? "").toLowerCase()}`;
    if (!s.city || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** US city/town autocomplete via Photon (OSM). */
export async function searchUsCitiesPhoton(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    limit: "15",
    lang: "en",
    bbox: US_BBOX,
  });
  for (const tag of PLACE_TAGS) {
    params.append("osm_tag", tag);
  }

  const features = await photonFetch(params);
  const suggestions = features
    .map(toCitySuggestion)
    .filter((s): s is AddressSuggestion => Boolean(s));

  return rankByQuery(dedupeByCityState(suggestions), q).slice(0, 10);
}

/** US street / place address autocomplete via Photon. */
export async function searchUsAddressesPhoton(
  query: string,
  region?: { city?: string; state?: string }
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const variants = [
    [q, region?.city, region?.state].filter(Boolean).join(", "),
    [q, region?.city].filter(Boolean).join(", "),
    q,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const featureSets = await Promise.all(
    variants.map(async (variant) => {
      const params = new URLSearchParams({
        q: variant,
        limit: "10",
        lang: "en",
        bbox: US_BBOX,
      });
      return photonFetch(params);
    })
  );

  const suggestions = featureSets
    .flat()
    .map(toAddressSuggestion)
    .filter((s): s is AddressSuggestion => Boolean(s))
    .filter((s) => {
      if (!region?.state) return true;
      return statesMatch(s.state, region.state);
    });

  // Prefer rows that look like street addresses when the query has a house number
  const hasNumber = /\d/.test(q);
  const ranked = [...suggestions].sort((a, b) => {
    const aStreet = a.street ? 0 : 1;
    const bStreet = b.street ? 0 : 1;
    if (hasNumber && aStreet !== bStreet) return aStreet - bStreet;
    return 0;
  });

  const seen = new Set<string>();
  return ranked
    .filter((s) => {
      const key = `${s.displayName.toLowerCase()}|${s.lat}|${s.lon}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}
