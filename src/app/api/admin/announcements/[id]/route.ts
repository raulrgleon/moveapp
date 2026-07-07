import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const body = (await req.json()) as {
    message?: string;
    type?: string;
    active?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
  };

  const data: {
    message?: string;
    type?: string;
    active?: boolean;
    startsAt?: Date | null;
    endsAt?: Date | null;
  } = {};

  if (body.message !== undefined) data.message = body.message.trim();
  if (body.type !== undefined && ["info", "warning", "maintenance"].includes(body.type)) {
    data.type = body.type;
  }
  if (body.active !== undefined) data.active = body.active;
  if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;

  const announcement = await prisma.systemAnnouncement.update({
    where: { id: params.id },
    data,
  });

  await logAdminAction({
    adminId: admin.id,
    action: "announcement.update",
    targetType: "announcement",
    targetId: params.id,
    details: { active: body.active },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ announcement });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  await prisma.systemAnnouncement.delete({ where: { id: params.id } });

  await logAdminAction({
    adminId: admin.id,
    action: "announcement.delete",
    targetType: "announcement",
    targetId: params.id,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
