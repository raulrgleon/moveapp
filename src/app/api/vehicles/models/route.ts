import { NextRequest, NextResponse } from "next/server";
import { fetchModelsForMakeYear } from "@/lib/vehicles/nhtsa";
import { getCatalogModels, isVehicleCatalogLoaded } from "@/lib/vehicles/vehicle-catalog";

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get("year");
  const makeId = request.nextUrl.searchParams.get("makeId");

  if (!year || !makeId) {
    return NextResponse.json(
      { error: "year and makeId are required" },
      { status: 400 }
    );
  }

  const makeNum = Number(makeId);
  if (!Number.isFinite(makeNum)) {
    return NextResponse.json({ error: "Invalid makeId" }, { status: 400 });
  }

  if (isVehicleCatalogLoaded()) {
    const cached = getCatalogModels(makeNum, year);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Vehicle-Source": "catalog" },
      });
    }
  }

  try {
    const models = await fetchModelsForMakeYear(makeNum, year);
    return NextResponse.json(models, {
      headers: { "X-Vehicle-Source": "nhtsa" },
    });
  } catch (error) {
    console.error("vehicles/models error:", error);
    return NextResponse.json(
      { error: "Could not load vehicle models" },
      { status: 500 }
    );
  }
}
