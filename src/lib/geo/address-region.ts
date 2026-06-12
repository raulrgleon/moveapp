/** US state abbreviations → full names (Nominatim prefers full names). */
const ABBR_TO_NAME: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

const NAME_TO_ABBR = Object.fromEntries(
  Object.entries(ABBR_TO_NAME).map(([abbr, name]) => [name.toLowerCase(), abbr])
);

/** Normalize "TX" or "Texas" to canonical full name for search/compare. */
export function normalizeUsState(input?: string | null): string | null {
  if (!input?.trim()) return null;
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && ABBR_TO_NAME[upper]) {
    return ABBR_TO_NAME[upper];
  }
  const fromName = NAME_TO_ABBR[trimmed.toLowerCase()];
  if (fromName) {
    return ABBR_TO_NAME[fromName];
  }
  return trimmed;
}

export function statesMatch(a?: string | null, b?: string | null): boolean {
  if (!b?.trim()) return true;
  if (!a?.trim()) return false;
  return normalizeUsState(a)?.toLowerCase() === normalizeUsState(b)?.toLowerCase();
}

/** Parse "Huntington, WV" or "Austin, Texas" from a city label. */
export function parseCityStateLabel(label: string): { city?: string; state?: string } {
  const parts = label.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      city: parts[0],
      state: parts[parts.length - 1],
    };
  }
  if (parts.length === 1) {
    return { city: parts[0] };
  }
  return {};
}

export interface AddressSearchRegion {
  state?: string;
  city?: string;
  lat?: number;
  lon?: number;
}

/** Build Nominatim query scoped to destination area. */
export function buildRegionalAddressQuery(streetQuery: string, region?: AddressSearchRegion): string {
  const q = streetQuery.trim();
  if (!region) return q;

  const state = normalizeUsState(region.state) ?? region.state?.trim();
  const city = region.city?.trim();

  if (city && state) return `${q}, ${city}, ${state}, USA`;
  if (state) return `${q}, ${state}, USA`;
  return q;
}

/** Viewbox ~40 mi around destination city center (Nominatim: left, top, right, bottom). */
export function buildViewbox(lat: number, lon: number, delta = 0.55): string {
  const minLon = lon - delta;
  const maxLon = lon + delta;
  const minLat = lat - delta;
  const maxLat = lat + delta;
  return `${minLon},${maxLat},${maxLon},${minLat}`;
}
