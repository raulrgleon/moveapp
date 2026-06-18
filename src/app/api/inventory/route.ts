import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { replaceInventory } from "@/lib/db/move-service";
import { requireProSubscription } from "@/lib/billing/require-pro";
import type { InventoryBox } from "@/lib/inventory/types";

export async function PUT(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const { boxes } = (await req.json()) as { boxes: InventoryBox[] };
    await replaceInventory(result.user.id, boxes ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/inventory error:", error);
    return NextResponse.json({ error: "Failed to save inventory" }, { status: 500 });
  }
}
