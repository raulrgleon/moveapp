import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail, unauthorized } from "@/lib/api-auth";
import { replaceInventory } from "@/lib/db/move-service";
import type { InventoryBox } from "@/lib/inventory/types";

export async function PUT(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  try {
    const { boxes } = (await req.json()) as { boxes: InventoryBox[] };
    await replaceInventory(email, boxes ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/inventory error:", error);
    return NextResponse.json({ error: "Failed to save inventory" }, { status: 500 });
  }
}
