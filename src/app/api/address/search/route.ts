import { NextRequest, NextResponse } from "next/server";
import {
  buildRegionalAddressQuery,
  buildViewbox,
  normalizeUsState,
  statesMatch,
} from "@/lib/geo/address-region";
import { parseNominatimResult } from "@/lib/geo/nominatim";
import { searchUsCities } from "@/lib/geo/city-search";
import { enforcePublicRateLimit } from "@/lib/public-api-rate-limit";

const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilotai.com)";

const searchCache = new Map<string, { expires: number; data: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function parseCoord(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
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
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set(
      "q",
      buildRegionalAddressQuery(q, {
        state: stateParam,
        city: cityParam,
        lat,
        lon,
      })
    );
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "8");
    url.searchParams.set("countrycodes", "us");

    if (lat != null && lon != null) {
      url.searchParams.set("viewbox", buildViewbox(lat, lon));
      url.searchParams.set("bounded", "1");
    }

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();
    let suggestions = (data as Parameters<typeof parseNominatimResult>[0][]).map(
      parseNominatimResult
    );

    if (stateParam) {
      const targetState = normalizeUsState(stateParam);
      suggestions = suggestions.filter((s) => statesMatch(s.state, targetState));
    }

    const payload = suggestions.slice(0, 6);
    searchCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Address search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
