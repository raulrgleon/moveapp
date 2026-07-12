import type { AddressSuggestion } from "@/lib/geo/nominatim";
import { normalizeUsState } from "@/lib/geo/address-region";

/**
 * US Census Bureau Geocoder — official US address database (TIGER/Line).
 * Much more complete for residential street addresses than OpenStreetMap.
 * https://geocoding.geo.census.gov/geocoder/
 */

const CENSUS_BASE = "https://geocoding.geo.census.gov/geocoder/locations";

interface CensusAddressComponents {
  zip?: string;
  streetName?: string;
  preType?: string;
  city?: string;
  preDirection?: string;
  suffixDirection?: string;
  fromAddress?: string;
  state?: string;
  suffixType?: string;
}

interface CensusMatch {
  matchedAddress?: string;
  coordinates?: { x?: number; y?: number };
  addressComponents?: CensusAddressComponents;
}

function stateToAbbr(input?: string | null): string | undefined {
  const full = normalizeUsState(input);
  if (!full) return undefined;
  const map: Record<string, string> = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
    "District of Columbia": "DC",
  };
  return map[full] ?? (input && input.length === 2 ? input.toUpperCase() : undefined);
}

function titleCaseStreet(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length <= 2 && /^[a-z]+$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function matchToSuggestion(match: CensusMatch, index: number): AddressSuggestion | null {
  const lon = match.coordinates?.x;
  const lat = match.coordinates?.y;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const c = match.addressComponents ?? {};
  const house = c.fromAddress?.trim() ?? "";
  const streetParts = [c.preDirection, c.preType, c.streetName, c.suffixType, c.suffixDirection]
    .filter(Boolean)
    .join(" ");
  const street = [house, titleCaseStreet(streetParts)].filter(Boolean).join(" ").trim();
  const city = c.city ? titleCaseStreet(c.city) : "";
  const stateAbbr = c.state?.toUpperCase() ?? "";
  const stateFull = normalizeUsState(stateAbbr) ?? stateAbbr;
  const zip = c.zip?.trim();

  const displayName =
    match.matchedAddress
      ?.split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p, i) => (i === 0 ? titleCaseStreet(p) : p))
      .join(", ") ??
    [street, city, stateAbbr, zip, "United States"].filter(Boolean).join(", ");

  return {
    placeId: `census-${lat}-${lon}-${index}`,
    displayName: displayName.includes("United States")
      ? displayName
      : `${displayName}, United States`,
    lat: lat as number,
    lon: lon as number,
    city: city || undefined,
    state: stateFull || undefined,
    postcode: zip,
    street: street || undefined,
    country: "United States",
  };
}

async function censusFetch(url: string): Promise<CensusMatch[]> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    result?: { addressMatches?: CensusMatch[] | null };
  };
  return data.result?.addressMatches ?? [];
}

/** Structured Census lookup: street + city + state (best accuracy). */
export async function searchCensusAddress(opts: {
  street: string;
  city?: string;
  state?: string;
  zip?: string;
}): Promise<AddressSuggestion[]> {
  const street = opts.street.trim();
  if (street.length < 3) return [];

  const params = new URLSearchParams({
    street,
    benchmark: "Public_AR_Current",
    format: "json",
  });
  if (opts.city?.trim()) params.set("city", opts.city.trim());
  if (opts.state?.trim()) {
    params.set("state", stateToAbbr(opts.state) ?? opts.state.trim());
  }
  if (opts.zip?.trim()) params.set("zip", opts.zip.trim());

  const matches = await censusFetch(`${CENSUS_BASE}/address?${params.toString()}`);
  return matches
    .map((m, i) => matchToSuggestion(m, i))
    .filter((s): s is AddressSuggestion => Boolean(s));
}

/** One-line Census lookup — good when the typed string already includes city/state. */
export async function searchCensusOneline(address: string): Promise<AddressSuggestion[]> {
  const q = address.trim();
  if (q.length < 5) return [];

  const params = new URLSearchParams({
    address: q,
    benchmark: "Public_AR_Current",
    format: "json",
  });

  const matches = await censusFetch(`${CENSUS_BASE}/onelineaddress?${params.toString()}`);
  return matches
    .map((m, i) => matchToSuggestion(m, i))
    .filter((s): s is AddressSuggestion => Boolean(s));
}

/**
 * Search US street addresses via Census Bureau.
 * Tries structured (street/city/state) first, then one-line with region appended.
 */
export async function searchUsAddressesCensus(
  query: string,
  region?: { city?: string; state?: string }
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  // Census works best once there is a house number
  if (!/\d/.test(q)) return [];

  const [structured, onelineRegional, onelineRaw] = await Promise.allSettled([
    searchCensusAddress({
      street: q,
      city: region?.city,
      state: region?.state,
    }),
    searchCensusOneline(
      [q, region?.city, stateToAbbr(region?.state) ?? region?.state].filter(Boolean).join(", ")
    ),
    searchCensusOneline(q),
  ]);

  const merged: AddressSuggestion[] = [];
  for (const settled of [structured, onelineRegional, onelineRaw]) {
    if (settled.status === "fulfilled") merged.push(...settled.value);
  }

  const seen = new Set<string>();
  return merged.filter((s) => {
    const key = `${s.lat.toFixed(5)}|${s.lon.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
