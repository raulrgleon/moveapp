import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail, unauthorized } from "@/lib/api-auth";
import { replaceChecklist } from "@/lib/db/move-service";
import type { ChecklistTask } from "@/lib/types";

export async function PUT(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  try {
    const { tasks } = (await req.json()) as { tasks: ChecklistTask[] };
    await replaceChecklist(email, tasks ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/checklist error:", error);
    return NextResponse.json({ error: "Failed to save checklist" }, { status: 500 });
  }
}
