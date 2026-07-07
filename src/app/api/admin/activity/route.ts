import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import {
  ACTIVITY_CATEGORIES,
  fetchActivityDashboard,
  type ActivityCategory,
  type ActivitySource,
} from "@/lib/admin/activity-dashboard";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const params = req.nextUrl.searchParams;
  const limit = Number(params.get("limit") ?? 120);
  const source = (params.get("source") ?? "all") as "all" | ActivitySource;
  const category = (params.get("category") ?? "all") as ActivityCategory;
  const q = params.get("q") ?? undefined;

  if (!["all", "admin", "user", "partner"].includes(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  if (!ACTIVITY_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const data = await fetchActivityDashboard({ limit, source, category, q });
  return NextResponse.json(data);
}
