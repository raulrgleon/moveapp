import { NextResponse } from "next/server";
import { getVehicleYears } from "@/lib/vehicles/nhtsa";

export async function GET() {
  return NextResponse.json(getVehicleYears());
}
