import { NextRequest, NextResponse } from "next/server";
import { fetchHousingComparison, emptyMarketSummary } from "@/lib/rentcast/rentcast";
import { buildFallbackHousingComparison } from "@/lib/housing/fallback-market";
import { resolveZipFromQuery } from "@/lib/geo/resolve-zip";
import { recommendBedroomsFromHousehold } from "@/lib/move/household";
import type { HousingMarketResponse } from "@/lib/rentcast/types";
import { enforcePublicRateLimit } from "@/lib/public-api-rate-limit";

export async function GET(req: NextRequest) {
  const limited = await enforcePublicRateLimit(req, "housing-market", 30, 60_000);
  if (limited) return limited;

  const origin = req.nextUrl.searchParams.get("origin")?.trim();
  const destination = req.nextUrl.searchParams.get("destination")?.trim();
  const originZipParam = req.nextUrl.searchParams.get("originZip")?.trim();
  const destZipParam = req.nextUrl.searchParams.get("destZip")?.trim();
  const household = req.nextUrl.searchParams.get("household")?.trim() ?? "";

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
  }

  const recommendedBedrooms = recommendBedroomsFromHousehold(household);

  const [originZip, destZip] = await Promise.all([
    originZipParam ?? resolveZipFromQuery(origin),
    destZipParam ?? resolveZipFromQuery(destination),
  ]);

  if (!originZip && !destZip) {
    return NextResponse.json({
      origin: null,
      destination: null,
      metrics: [],
      housingContext: { recommendedBedrooms, householdLabel: household },
      rentcastMissing: true,
    } satisfies HousingMarketResponse);
  }

  const hasRentCast = Boolean(process.env.RENTCAST_API_KEY);
  let payload: HousingMarketResponse | null = null;

  if (hasRentCast) {
    try {
      const result = await fetchHousingComparison(origin, destination, recommendedBedrooms);
      if (result.metrics.length > 0 && result.origin && result.destination) {
        payload = {
          ...result,
          source: "rentcast",
          housingContext: { recommendedBedrooms, householdLabel: household },
        };
      }
    } catch (error) {
      console.error("Housing market API error:", error);
    }
  }

  if (!payload && originZip && destZip) {
    payload = buildFallbackHousingComparison(
      origin,
      originZip,
      destination,
      destZip,
      recommendedBedrooms,
      household
    );
  }

  if (!payload) {
    return NextResponse.json({
      origin: originZip ? emptyMarketSummary(origin, originZip) : null,
      destination: destZip ? emptyMarketSummary(destination, destZip) : null,
      metrics: [],
      housingContext: { recommendedBedrooms, householdLabel: household },
      rentcastMissing: !hasRentCast,
    } satisfies HousingMarketResponse);
  }

  if (!hasRentCast && payload.source !== "fallback") {
    payload.rentcastMissing = true;
  }

  if (!payload.housingContext) {
    payload.housingContext = { recommendedBedrooms, householdLabel: household };
  }

  return NextResponse.json(payload);
}
