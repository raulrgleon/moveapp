import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { fetchUtilitiesForLocation } from "@/lib/utilities/fetch-utilities";
import type { Locale } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return unauthorized();

  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  const address = req.nextUrl.searchParams.get("address");
  const localeParam = req.nextUrl.searchParams.get("locale");
  const locale: Locale = localeParam === "es" || user.locale === "es" ? "es" : "en";

  try {
    const result = await fetchUtilitiesForLocation({
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      address: address ?? undefined,
      locale,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/utilities error:", error);
    return NextResponse.json({ error: "Could not load utilities" }, { status: 500 });
  }
}
