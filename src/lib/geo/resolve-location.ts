import { parseCityStateLabel } from "@/lib/geo/address-region";
import { resolveZipFromQuery } from "@/lib/geo/resolve-zip";

const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilotai.com)";

export interface ResolvedLocation {
  label: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

async function nominatimSearch(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    display_name?: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      postcode?: string;
    };
  }[];

  return data[0] ?? null;
}

function extractZip(postcode?: string): string | null {
  if (!postcode) return null;
  const match = postcode.match(/\d{5}/);
  return match ? match[0] : null;
}

function cityFromAddress(address?: {
  city?: string;
  town?: string;
  village?: string;
}): string | null {
  if (!address) return null;
  return address.city ?? address.town ?? address.village ?? null;
}

/** Resolve city label to ZIP, state, and city name for comparisons. */
export async function resolveLocationFromQuery(query: string): Promise<ResolvedLocation | null> {
  const label = query.trim();
  if (label.length < 2) return null;

  const parsed = parseCityStateLabel(label);
  const zipCode = await resolveZipFromQuery(label);

  const hit = await nominatimSearch(label);
  const address = hit?.address;

  const city =
    parsed.city ??
    cityFromAddress(address) ??
    label.split(",")[0]?.trim() ??
    null;

  const state = address?.state ?? parsed.state ?? null;
  const resolvedZip = zipCode ?? extractZip(address?.postcode);

  if (!city && !state && !resolvedZip) return null;

  return {
    label,
    city,
    state,
    zipCode: resolvedZip,
  };
}
