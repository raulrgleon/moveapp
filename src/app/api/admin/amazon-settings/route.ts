import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getAmazonAppSettings, updateAmazonAppSettings } from "@/lib/amazon/settings";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const settings = await getAmazonAppSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const body = (await req.json()) as {
    associateTag?: string;
    marketplaceDomain?: string;
    defaultProducts?: Record<string, string>;
  };

  try {
    const updated = await updateAmazonAppSettings({
      associateTag: body.associateTag ?? "",
      marketplaceDomain: body.marketplaceDomain ?? "www.amazon.com",
      defaultProducts: body.defaultProducts,
    });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save Amazon settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
