import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const { newOwnerId } = (await req.json()) as { newOwnerId?: string };
  if (!newOwnerId?.trim()) {
    return NextResponse.json({ error: "newOwnerId required" }, { status: 400 });
  }

  const move = await prisma.move.findUnique({ where: { id: params.id } });
  if (!move) {
    return jsonErrorFromRequest(req, "noMove", 404);
  }

  const newOwner = await prisma.user.findUnique({ where: { id: newOwnerId } });
  if (!newOwner || newOwner.role === "admin") {
    return NextResponse.json({ error: "Invalid new owner" }, { status: 400 });
  }

  const previousOwnerId = move.userId;
  await prisma.move.update({
    where: { id: params.id },
    data: { userId: newOwnerId },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "move.transfer",
    targetType: "move",
    targetId: params.id,
    details: { previousOwnerId, newOwnerId },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
