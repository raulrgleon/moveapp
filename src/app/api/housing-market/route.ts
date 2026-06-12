import { NextRequest, NextResponse } from "next/server";
import { fetchHousingComparison } from "@/lib/rentcast/rentcast";
import { buildFallbackHousingComparison } from "@/lib/housing/fallback-market";
import { resolveZipFromQuery } from "@/lib/geo/resolve-zip";
import type { HousingMarketResponse } from "@/lib/rentcast/types";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.searchParams.get("origin")?.trim();
  const destination = req.nextUrl.searchParams.get("destination")?.trim();
  const originZipParam = req.nextUrl.searchParams.get("originZip")?.trim();
  const destZipParam = req.nextUrl.searchParams.get("destZip")?.trim();

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
  }

  const [originZip, destZip] = await Promise.all([
    originZipParam ?? resolveZipFromQuery(origin),
    destZipParam ?? resolveZipFromQuery(destination),
  ]);

  if (!originZip && !destZip) {
    return NextResponse.json({
      origin: null,
      destination: null,
      metrics: [],
      rentcastMissing: true,
    } satisfies HousingMarketResponse);
  }

  const hasRentCast = Boolean(process.env.RENTCAST_API_KEY);
  let payload: HousingMarketResponse | null = null;

  if (hasRentCast) {
    try {
      const result = await fetchHousingComparison(origin, destination);
      if (result.metrics.length > 0 && result.origin && result.destination) {
        payload = { ...result, source: "rentcast" };
      }
    } catch (error) {
      console.error("Housing market API error:", error);
    }
  }

  if (!payload && originZip && destZip) {
    payload = buildFallbackHousingComparison(origin, originZip, destination, destZip);
  }

  if (!payload) {
    return NextResponse.json({
      origin: originZip
        ? {
            label: origin,
            zipCode: originZip,
            averageRent: null,
            medianRent: null,
            rent2Bed: null,
            medianHomePrice: null,
            averageHomePrice: null,
            medianPricePerSqFt: null,
            medianRentPerSqFt: null,
            saleDaysOnMarket: null,
            rentalListings: null,
            saleListings: null,
          }
        : null,
      destination: destZip
        ? {
            label: destination,
            zipCode: destZip,
            averageRent: null,
            medianRent: null,
            rent2Bed: null,
            medianHomePrice: null,
            averageHomePrice: null,
            medianPricePerSqFt: null,
            medianRentPerSqFt: null,
            saleDaysOnMarket: null,
            rentalListings: null,
            saleListings: null,
          }
        : null,
      metrics: [],
      rentcastMissing: !hasRentCast,
    } satisfies HousingMarketResponse);
  }

  if (!hasRentCast && payload.source !== "fallback") {
    payload.rentcastMissing = true;
  }

  return NextResponse.json(payload);
}
