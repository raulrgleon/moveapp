import { NextResponse } from "next/server";
import { getUsVehicleMakes } from "@/lib/vehicles/us-vehicle-makes";

export async function GET() {
  return NextResponse.json(getUsVehicleMakes());
}
