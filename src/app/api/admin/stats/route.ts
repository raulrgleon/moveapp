import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getAdminStats } from "@/lib/admin/stats";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
