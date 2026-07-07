import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const invite = await prisma.moveCollaborator.findUnique({ where: { id: params.id } });
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  await prisma.moveCollaborator.delete({ where: { id: params.id } });

  await logAdminAction({
    adminId: admin.id,
    action: "invite.revoke",
    targetType: "invite",
    targetId: params.id,
    details: { email: invite.email, moveId: invite.moveId },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const { role } = (await req.json()) as { role?: "editor" | "viewer" };
  if (!role || !["editor", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const invite = await prisma.moveCollaborator.update({
    where: { id: params.id },
    data: { role },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "invite.update_role",
    targetType: "invite",
    targetId: params.id,
    details: { role },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ invite });
}
