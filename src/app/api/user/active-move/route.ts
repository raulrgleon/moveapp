import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { setActiveMove } from "@/lib/db/move-access";

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return unauthorized();

  const { moveId } = (await req.json()) as { moveId?: string };
  if (!moveId?.trim()) {
    return NextResponse.json({ error: "moveId required" }, { status: 400 });
  }

  try {
    const access = await setActiveMove(user.id, moveId.trim());
    return NextResponse.json({ ok: true, access });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to switch move";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
