import type { AddressSuggestion } from "@/lib/geo/nominatim";
import { searchUsCitiesPhoton } from "@/lib/geo/photon";
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

/** Populated-place feature codes from GeoNames / Open-Meteo. */
const CITY_FEATURE_CODES = new Set([
  "PPL",
  "PPLA",
  "PPLA2",
  "PPLA3",
  "PPLA4",
  "PPLA5",
  "PPLC",
  "PPLG",
  "PPLL",
  "PPLR",
  "PPLS",
  "PPLX",
]);

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

function rankByQuery(items: AddressSuggestion[], query: string): AddressSuggestion[] {
  const q = query.trim().toLowerCase();
  const score = (item: AddressSuggestion): number => {
    const city = (item.city ?? "").toLowerCase();
    if (city === q) return 0;
    if (city.startsWith(q)) return 1;
    if (city.includes(q)) return 2;
    return 3;
  };
  return [...items].sort((a, b) => score(a) - score(b));
}

async function searchOpenMeteo(query: string): Promise<AddressSuggestion[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "20");
  url.searchParams.set("language", "en");
  url.searchParams.set("countryCode", "US");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { results?: OpenMeteoResult[] };
  const results = (data.results ?? [])
    .filter((r) => {
      const code = (r.country_code ?? "").toUpperCase();
      if (code !== "US") return false;
      if (!r.feature_code) return true;
      return CITY_FEATURE_CODES.has(r.feature_code);
    })
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .map(toSuggestion);

  return dedupeCities(results);
}

/**
 * Search US cities — Photon (primary autocomplete) + Open-Meteo + local fallback.
 * Covers cities, towns, villages, and hamlets across the United States.
 */
export async function searchUsCities(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [photonSettled, openMeteoSettled] = await Promise.allSettled([
    searchUsCitiesPhoton(q),
    searchOpenMeteo(q),
  ]);

  const photon = photonSettled.status === "fulfilled" ? photonSettled.value : [];
  const openMeteo = openMeteoSettled.status === "fulfilled" ? openMeteoSettled.value : [];

  if (photonSettled.status === "rejected") {
    console.error("Photon city search error:", photonSettled.reason);
  }
  if (openMeteoSettled.status === "rejected") {
    console.error("Open-Meteo city search error:", openMeteoSettled.reason);
  }

  const merged = dedupeCities([...photon, ...openMeteo]);
  if (merged.length > 0) {
    return rankByQuery(merged, q).slice(0, 10);
  }

  return searchUsCitiesFallback(q);
}
