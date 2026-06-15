import type { AddressSuggestion } from "@/lib/geo/nominatim";
import { searchUsCitiesFallback } from "@/lib/geo/us-cities-fallback";

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  admin1?: string;
  feature_code?: string;
  population?: number;
}

const CITY_FEATURE_CODES = new Set(["PPL", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLC"]);

function toSuggestion(item: OpenMeteoResult): AddressSuggestion {
  const state = item.admin1 ?? "";
  const city = item.name;
  return {
    placeId: String(item.id),
    displayName: state ? `${city}, ${state}, United States` : `${city}, United States`,
    lat: item.latitude,
    lon: item.longitude,
    city,
    state,
    country: "United States",
  };
}

function dedupeCities(items: AddressSuggestion[]): AddressSuggestion[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    const key = `${s.city?.toLowerCase()}|${s.state?.toLowerCase()}`;
    if (!s.city || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchOpenMeteo(query: string): Promise<AddressSuggestion[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "12");
  url.searchParams.set("language", "en");
  url.searchParams.set("countryCode", "US");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { results?: OpenMeteoResult[] };
  const results = (data.results ?? [])
    .filter(
      (r) =>
        r.country_code === "US" &&
        (!r.feature_code || CITY_FEATURE_CODES.has(r.feature_code))
    )
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .map(toSuggestion);

  return dedupeCities(results).slice(0, 8);
}

/** Search US cities — Open-Meteo primary, local fallback if API unavailable. */
export async function searchUsCities(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const remote = await searchOpenMeteo(q);
    if (remote.length > 0) return remote;
  } catch (error) {
    console.error("Open-Meteo city search error:", error);
  }

  return searchUsCitiesFallback(q);
}
