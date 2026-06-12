import { NextRequest, NextResponse } from "next/server";
import {
  buildRegionalAddressQuery,
  buildViewbox,
  normalizeUsState,
  statesMatch,
} from "@/lib/geo/address-region";
import { parseNominatimResult } from "@/lib/geo/nominatim";

const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilot.ai)";

function parseCoord(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type")?.trim();
  const stateParam = req.nextUrl.searchParams.get("state")?.trim();
  const cityParam = req.nextUrl.searchParams.get("city")?.trim();
  const lat = parseCoord(req.nextUrl.searchParams.get("lat"));
  const lon = parseCoord(req.nextUrl.searchParams.get("lon"));

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    const isCity = type === "city";

    if (isCity) {
      url.searchParams.set("q", q);
    } else {
      url.searchParams.set(
        "q",
        buildRegionalAddressQuery(q, {
          state: stateParam,
          city: cityParam,
          lat,
          lon,
        })
      );
    }

    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", isCity ? "8" : "8");
    url.searchParams.set("countrycodes", "us");

    if (isCity) {
      url.searchParams.set("featuretype", "city");
    } else if (lat != null && lon != null) {
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

    if (isCity) {
      const seen = new Set<string>();
      suggestions = suggestions.filter((s) => {
        const city = s.city || s.displayName.split(",")[0]?.trim();
        const state = s.state || "";
        const key = `${city}|${state}`.toLowerCase();
        if (!city || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } else if (stateParam) {
      const targetState = normalizeUsState(stateParam);
      suggestions = suggestions.filter((s) => statesMatch(s.state, targetState));
    }

    return NextResponse.json(suggestions.slice(0, 6));
  } catch (error) {
    console.error("Address search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
