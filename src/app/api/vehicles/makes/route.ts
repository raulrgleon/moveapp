import { NextResponse } from "next/server";
import { fetchMakesForCars } from "@/lib/vehicles/nhtsa";

export async function GET() {
  try {
    const makes = await fetchMakesForCars();
    return NextResponse.json(makes);
  } catch (error) {
    console.error("vehicles/makes error:", error);
    return NextResponse.json(
      { error: "Could not load vehicle makes" },
      { status: 500 }
    );
  }
}
