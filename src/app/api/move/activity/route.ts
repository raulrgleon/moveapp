import { NextRequest, NextResponse } from "next/server";
import { requireMoveAccess } from "@/lib/api-auth";
import { listMoveActivities } from "@/lib/db/activity";

export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");
  const activities = await listMoveActivities(
    result.access.moveId,
    Number.isFinite(limit) ? Math.min(limit, 100) : 50
  );

  return NextResponse.json({ activities });
}
