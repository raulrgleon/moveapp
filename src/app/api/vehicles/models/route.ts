import { NextRequest, NextResponse } from "next/server";
import { fetchModelsForMakeYear } from "@/lib/vehicles/nhtsa";

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get("year");
  const makeId = request.nextUrl.searchParams.get("makeId");

  if (!year || !makeId) {
    return NextResponse.json(
      { error: "year and makeId are required" },
      { status: 400 }
    );
  }

  try {
    const models = await fetchModelsForMakeYear(Number(makeId), year);
    return NextResponse.json(models);
  } catch (error) {
    console.error("vehicles/models error:", error);
    return NextResponse.json(
      { error: "Could not load vehicle models" },
      { status: 500 }
    );
  }
}
