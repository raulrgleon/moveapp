import { NextRequest, NextResponse } from "next/server";
import {
  buildRegionalAddressQuery,
  buildViewbox,
  normalizeUsState,
  statesMatch,
} from "@/lib/geo/address-region";
import { parseNominatimResult } from "@/lib/geo/nominatim";
import { searchUsCities } from "@/lib/geo/city-search";
import { searchUsAddressesPhoton } from "@/lib/geo/photon";
import { enforcePublicRateLimit } from "@/lib/public-api-rate-limit";

const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilotai.com)";

const searchCache = new Map<string, { expires: number; data: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function parseCoord(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

async function searchNominatimAddresses(
  q: string,
  opts: {
    stateParam?: string;
    cityParam?: string;
    lat?: number;
    lon?: number;
  }
) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set(
    "q",
    buildRegionalAddressQuery(q, {
      state: opts.stateParam,
      city: opts.cityParam,
      lat: opts.lat,
      lon: opts.lon,
    })
  );
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "10");
  url.searchParams.set("countrycodes", "us");

  // Soft bias toward the region — do not hard-bound so nearby suburbs still appear
  if (opts.lat != null && opts.lon != null) {
    url.searchParams.set("viewbox", buildViewbox(opts.lat, opts.lon, 0.85));
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

  const cacheKey = `${type ?? "addr"}:${q.toLowerCase()}:${stateParam ?? ""}:${cityParam ?? ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const [photonSettled, nominatimSettled] = await Promise.allSettled([
      searchUsAddressesPhoton(q, { city: cityParam, state: stateParam }),
      searchNominatimAddresses(q, { stateParam, cityParam, lat, lon }),
    ]);

    const photon = photonSettled.status === "fulfilled" ? photonSettled.value : [];
    const nominatim = nominatimSettled.status === "fulfilled" ? nominatimSettled.value : [];

    if (photonSettled.status === "rejected") {
      console.error("Photon address search error:", photonSettled.reason);
    }
    if (nominatimSettled.status === "rejected") {
      console.error("Nominatim address search error:", nominatimSettled.reason);
    }

    const seen = new Set<string>();
    const merged = [...photon, ...nominatim].filter((s) => {
      const key = `${(s.street ?? "").toLowerCase()}|${(s.city ?? "").toLowerCase()}|${s.lat.toFixed(4)}|${s.lon.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const payload = merged.slice(0, 8);
    searchCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Address search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
