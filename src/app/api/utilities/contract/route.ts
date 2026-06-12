import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { contractUtilityProvider } from "@/lib/db/move-service";

export async function POST(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const body = (await req.json()) as { providerName?: string; category?: string };
    const providerName = body.providerName?.trim();
    const category = body.category?.trim();
    if (!providerName || !category) {
      return NextResponse.json({ error: "providerName and category required" }, { status: 400 });
    }

    const data = await contractUtilityProvider(result.user.id, providerName, category);
    return NextResponse.json({ ok: true, taskId: data.taskId });
  } catch (error) {
    console.error("POST /api/utilities/contract error:", error);
    return NextResponse.json({ error: "Could not mark utility as contracted" }, { status: 500 });
  }
}
