import { NextResponse } from "next/server";
import { getAmazonAppSettings } from "@/lib/amazon/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getAmazonAppSettings();
  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
