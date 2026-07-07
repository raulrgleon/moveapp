import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";
import { getAmazonAppSettings } from "@/lib/amazon/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getAmazonAppSettings();
  return NextResponse.json(
    {
      associateTag: settings.associateTag,
      marketplaceDomain: settings.marketplaceDomain,
      defaultProducts: settings.defaultProducts,
      hasAssociateTag: settings.hasAssociateTag,
    },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    }
  );
}
