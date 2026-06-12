import { NextRequest, NextResponse } from "next/server";
import { fetchHousingComparison } from "@/lib/rentcast/rentcast";
import type { HousingMarketResponse } from "@/lib/rentcast/types";

export async function GET(req: NextRequest) {
  if (!process.env.RENTCAST_API_KEY) {
    return NextResponse.json({ error: "RentCast API not configured" }, { status: 500 });
  }

  const origin = req.nextUrl.searchParams.get("origin")?.trim();
  const destination = req.nextUrl.searchParams.get("destination")?.trim();

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
  }

  try {
    const result = await fetchHousingComparison(origin, destination);
    const payload: HousingMarketResponse = result;
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Housing market API error:", error);
    return NextResponse.json({ error: "Failed to fetch housing data" }, { status: 500 });
  }
}
