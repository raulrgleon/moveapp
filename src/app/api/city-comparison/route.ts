import { NextRequest, NextResponse } from "next/server";
import {
  buildEssentialsComparisonMetrics,
  buildEssentialsSummary,
} from "@/lib/cost-of-living/essentials";
import { buildQoLComparison, buildComparisonVerdict } from "@/lib/cost-of-living/qol-metrics";
import type { CityComparisonResponse } from "@/lib/city-comparison/types";
import { buildFallbackHousingComparison, emptyMarketSummary } from "@/lib/housing/fallback-market";
import { resolveLocationFromQuery } from "@/lib/geo/resolve-location";
import { recommendBedroomsFromHousehold } from "@/lib/move/household";
import { fetchHousingComparison } from "@/lib/rentcast/rentcast";
import type { HousingMarketResponse } from "@/lib/rentcast/types";

async function loadHousing(
  origin: string,
  destination: string,
  originZip?: string | null,
  destZip?: string | null,
  household = ""
): Promise<HousingMarketResponse> {
  const recommendedBedrooms = recommendBedroomsFromHousehold(household);
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
      console.error("City comparison housing error:", error);
    }
  }

  const oZip = originZip ?? null;
  const dZip = destZip ?? null;

  if (!payload && oZip && dZip) {
    payload = buildFallbackHousingComparison(
      origin,
      oZip,
      destination,
      dZip,
      recommendedBedrooms,
      household
    );
  }

  if (!payload) {
    return {
      origin: oZip ? emptyMarketSummary(origin, oZip) : null,
      destination: dZip ? emptyMarketSummary(destination, dZip) : null,
      metrics: [],
      housingContext: { recommendedBedrooms, householdLabel: household },
      rentcastMissing: !hasRentCast,
    };
  }

  if (!hasRentCast && payload.source !== "fallback") {
    payload.rentcastMissing = true;
  }

  if (!payload.housingContext) {
    payload.housingContext = { recommendedBedrooms, householdLabel: household };
  }

  return payload;
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.searchParams.get("origin")?.trim();
  const destination = req.nextUrl.searchParams.get("destination")?.trim();
  const originZipParam = req.nextUrl.searchParams.get("originZip")?.trim();
  const destZipParam = req.nextUrl.searchParams.get("destZip")?.trim();
  const household = req.nextUrl.searchParams.get("household")?.trim() ?? "";

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
  }

  const [originLoc, destLoc] = await Promise.all([
    resolveLocationFromQuery(origin),
    resolveLocationFromQuery(destination),
  ]);

  const originZip = originZipParam ?? originLoc?.zipCode ?? null;
  const destZip = destZipParam ?? destLoc?.zipCode ?? null;

  const [housing, essentialsOrigin, essentialsDest] = await Promise.all([
    loadHousing(origin, destination, originZip, destZip, household),
    originLoc ? Promise.resolve(buildEssentialsSummary(originLoc)) : Promise.resolve(null),
    destLoc ? Promise.resolve(buildEssentialsSummary(destLoc)) : Promise.resolve(null),
  ]);

  const essentialsMetrics =
    essentialsOrigin && essentialsDest
      ? buildEssentialsComparisonMetrics(essentialsOrigin, essentialsDest)
      : [];

  const qol =
    originLoc && destLoc ? buildQoLComparison(originLoc, destLoc) : null;

  const housingBetter = housing.metrics.filter((m) => m.trend === "better").length;
  const housingWorse = housing.metrics.filter((m) => m.trend === "worse").length;
  const essBetter = essentialsMetrics.filter((m) => m.trend === "better").length;
  const essWorse = essentialsMetrics.filter((m) => m.trend === "worse").length;

  const verdict = qol
    ? buildComparisonVerdict(housingBetter, housingWorse, essBetter, essWorse, qol.metrics)
    : undefined;

  const response: CityComparisonResponse = {
    ...housing,
    essentials: {
      origin: essentialsOrigin,
      destination: essentialsDest,
      metrics: essentialsMetrics,
    },
    qualityOfLife: qol
      ? { origin: qol.origin, destination: qol.destination, metrics: qol.metrics }
      : undefined,
    verdict,
  };

  return NextResponse.json(response);
}
