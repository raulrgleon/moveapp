import { NextResponse } from "next/server";
import { getServerBuildId } from "@/lib/app-version";

export const dynamic = "force-dynamic";

export async function GET() {
  const buildId = getServerBuildId();
  return NextResponse.json(
    { buildId },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    }
  );
}
