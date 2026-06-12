import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const announcements = await prisma.systemAnnouncement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const body = (await req.json()) as {
    message?: string;
    type?: string;
    active?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
  };

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const type = ["info", "warning", "maintenance"].includes(body.type ?? "")
    ? body.type!
    : "info";

  const announcement = await prisma.systemAnnouncement.create({
    data: {
      message: body.message.trim(),
      type,
      active: body.active ?? true,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "announcement.create",
    targetType: "announcement",
    targetId: announcement.id,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
