import { NextRequest, NextResponse } from "next/server";
import {
  buildRegionalAddressQuery,
  buildViewbox,
  normalizeUsState,
  statesMatch,
} from "@/lib/geo/address-region";
import { searchUsAddressesCensus } from "@/lib/geo/census-geocoder";
import { parseNominatimResult, type AddressSuggestion } from "@/lib/geo/nominatim";
import { searchUsCities } from "@/lib/geo/city-search";
import { searchUsAddressesPhoton } from "@/lib/geo/photon";
import { enforcePublicRateLimit } from "@/lib/public-api-rate-limit";

const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilotai.com)";

const searchCache = new Map<string, { expires: number; data: unknown }>();
const CACHE_TTL_MS = 2 * 60 * 1000;

function parseCoord(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function dedupeSuggestions(items: AddressSuggestion[]): AddressSuggestion[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    const key = `${(s.street ?? s.displayName).toLowerCase()}|${(s.city ?? "").toLowerCase()}|${s.lat.toFixed(4)}|${s.lon.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rankAddressSuggestions(items: AddressSuggestion[], query: string): AddressSuggestion[] {
  const q = query.trim().toLowerCase();
  const houseMatch = q.match(/^(\d+)/);
  const house = houseMatch?.[1];

  const score = (item: AddressSuggestion): number => {
    const street = (item.street ?? "").toLowerCase();
    const display = item.displayName.toLowerCase();
    let s = 10;
    if (house && street.startsWith(house)) s -= 5;
    if (street.includes(q) || display.includes(q)) s -= 2;
    if (item.placeId.startsWith("census-")) s -= 3; // prefer official US matches
    if (item.street) s -= 1;
    return s;
  };

  return [...items].sort((a, b) => score(a) - score(b));
}

async function searchNominatimAddresses(
  q: string,
  opts: {
    stateParam?: string;
    cityParam?: string;
    lat?: number;
    lon?: number;
  }
): Promise<AddressSuggestion[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");

  // Prefer structured search when we have city/state — more reliable for house numbers
  if (opts.cityParam || opts.stateParam) {
    url.searchParams.set("street", q);
    if (opts.cityParam) url.searchParams.set("city", opts.cityParam);
    if (opts.stateParam) {
      url.searchParams.set("state", normalizeUsState(opts.stateParam) ?? opts.stateParam);
    }
    url.searchParams.set("country", "USA");
  } else {
    url.searchParams.set(
      "q",
      buildRegionalAddressQuery(q, {
        state: opts.stateParam,
        city: opts.cityParam,
        lat: opts.lat,
        lon: opts.lon,
      })
    );
  }

  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "10");
  url.searchParams.set("countrycodes", "us");

  if (opts.lat != null && opts.lon != null) {
    url.searchParams.set("viewbox", buildViewbox(opts.lat, opts.lon, 1.2));
  }

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  let suggestions = (data as Parameters<typeof parseNominatimResult>[0][]).map(
    parseNominatimResult
  );

  if (opts.stateParam) {
    const targetState = normalizeUsState(opts.stateParam);
    suggestions = suggestions.filter((s) => statesMatch(s.state, targetState));
  }

  return suggestions;
}

export async function GET(req: NextRequest) {
  const limited = await enforcePublicRateLimit(req, "address-search", 80, 60_000);
  if (limited) return limited;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type")?.trim();
  const stateParam = req.nextUrl.searchParams.get("state")?.trim();
  const cityParam = req.nextUrl.searchParams.get("city")?.trim();
  const lat = parseCoord(req.nextUrl.searchParams.get("lat"));
  const lon = parseCoord(req.nextUrl.searchParams.get("lon"));

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  if (type === "city") {
    const cacheKey = `city:${q.toLowerCase()}`;
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.data);
    }
    try {
      const payload = await searchUsCities(q);
      searchCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: payload });
      return NextResponse.json(payload);
    } catch (error) {
      console.error("City search error:", error);
      return NextResponse.json([], { status: 500 });
    }
  }

  const cacheKey = `addr:${q.toLowerCase()}:${stateParam ?? ""}:${cityParam ?? ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    // Census = official US addresses; Photon/Nominatim = OSM (incomplete for homes)
    const [censusSettled, photonSettled, nominatimSettled] = await Promise.allSettled([
      searchUsAddressesCensus(q, { city: cityParam, state: stateParam }),
      searchUsAddressesPhoton(q, { city: cityParam, state: stateParam }),
      searchNominatimAddresses(q, { stateParam, cityParam, lat, lon }),
    ]);

    const census = censusSettled.status === "fulfilled" ? censusSettled.value : [];
    const photon = photonSettled.status === "fulfilled" ? photonSettled.value : [];
    const nominatim = nominatimSettled.status === "fulfilled" ? nominatimSettled.value : [];

    if (censusSettled.status === "rejected") {
      console.error("Census address search error:", censusSettled.reason);
    }
    if (photonSettled.status === "rejected") {
      console.error("Photon address search error:", photonSettled.reason);
    }
    if (nominatimSettled.status === "rejected") {
      console.error("Nominatim address search error:", nominatimSettled.reason);
    }

    // Census first — authoritative for US residential addresses
    const merged = rankAddressSuggestions(
      dedupeSuggestions([...census, ...photon, ...nominatim]),
      q
    );

    const payload = merged.slice(0, 8);
    searchCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Address search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
