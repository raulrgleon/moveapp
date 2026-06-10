import { NextRequest, NextResponse } from "next/server";
import { parseNominatimResult } from "@/lib/geo/nominatim";

const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilot.ai)";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("countrycodes", "us");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();
    const suggestions = (data as Parameters<typeof parseNominatimResult>[0][]).map(
      parseNominatimResult
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Address search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
