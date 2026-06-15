import { NextRequest, NextResponse } from "next/server";
import { lookupVehicleMpg } from "@/lib/vehicles/fuel-economy";

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year");
  const make = req.nextUrl.searchParams.get("make");
  const model = req.nextUrl.searchParams.get("model");
  const trim = req.nextUrl.searchParams.get("trim") ?? undefined;

  if (!year || !make || !model) {
    return NextResponse.json({ error: "year, make, and model are required" }, { status: 400 });
  }

  const mpg = await lookupVehicleMpg(year, make, model, trim);
  if (!mpg) {
    return NextResponse.json({ error: "MPG data not found for this vehicle" }, { status: 404 });
  }

  return NextResponse.json(mpg, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
