import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getSystemHealth } from "@/lib/admin/health";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const health = await getSystemHealth();
  return NextResponse.json(health);
}
