import { NextResponse } from "next/server";
import { getAmazonAppSettings } from "@/lib/amazon/settings";

export async function GET() {
  const settings = await getAmazonAppSettings();
  return NextResponse.json(settings);
}
