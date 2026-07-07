import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import { destroySession } from "@/lib/auth/session";

type RouteContext = { params: { id: string } };

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const session = await prisma.session.findUnique({ where: { id: params.id } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await destroySession(session.token);
  await prisma.session.delete({ where: { id: params.id } });

  await logAdminAction({
    adminId: admin.id,
    action: "user.session.revoke",
    targetType: "session",
    targetId: params.id,
    details: { userId: session.userId },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
