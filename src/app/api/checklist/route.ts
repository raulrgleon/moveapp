import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, requireCanEditData, requireMoveAccess, unauthorized } from "@/lib/api-auth";
import { replaceChecklist } from "@/lib/db/move-service";
import type { ChecklistTask } from "@/lib/types";

export async function PUT(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const { tasks } = (await req.json()) as { tasks: ChecklistTask[] };
    await replaceChecklist(result.user.id, tasks ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/checklist error:", error);
    return NextResponse.json({ error: "Failed to save checklist" }, { status: 500 });
  }
}
