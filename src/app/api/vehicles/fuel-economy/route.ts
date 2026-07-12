import { NextRequest, NextResponse } from "next/server";
import {
  listEpaVehicleOptions,
  lookupVehicleMpg,
  lookupVehicleMpgByEpaId,
} from "@/lib/vehicles/fuel-economy";

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year");
  const make = req.nextUrl.searchParams.get("make");
  const model = req.nextUrl.searchParams.get("model");
  const trim = req.nextUrl.searchParams.get("trim") ?? undefined;
  const epaId = req.nextUrl.searchParams.get("epaId") ?? undefined;
  const listOptions = req.nextUrl.searchParams.get("options") === "1";

  if (epaId) {
    const mpg = await lookupVehicleMpgByEpaId(epaId);
    if (!mpg) {
      return NextResponse.json({ error: "MPG data not found for this EPA vehicle" }, { status: 404 });
    }
    return NextResponse.json(mpg, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  if (!year || !make || !model) {
    return NextResponse.json({ error: "year, make, and model are required" }, { status: 400 });
  }

  if (listOptions) {
    const options = await listEpaVehicleOptions(year, make, model);
    return NextResponse.json(
      { options },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  }

  const mpg = await lookupVehicleMpg(year, make, model, trim, epaId);
  if (!mpg) {
    return NextResponse.json({ error: "MPG data not found for this vehicle" }, { status: 404 });
  }

  return NextResponse.json(mpg, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
