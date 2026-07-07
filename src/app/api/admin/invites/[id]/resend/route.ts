import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import { sendMoveInviteEmail } from "@/lib/notifications/email";

type RouteContext = { params: { id: string } };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const invite = await prisma.moveCollaborator.findUnique({
    where: { id: params.id },
    include: { move: { include: { user: { select: { name: true, locale: true } } } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
  }

  let inviteToken = invite.inviteToken;
  if (!inviteToken) {
    inviteToken = randomUUID();
    await prisma.moveCollaborator.update({
      where: { id: params.id },
      data: { inviteToken },
    });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendMoveInviteEmail(
    invite.email,
    invite.move.user.name,
    `${base}/invite/${inviteToken}`,
    invite.move.user.locale === "es" ? "es" : "en"
  );

  await logAdminAction({
    adminId: admin.id,
    action: "invite.resend",
    targetType: "invite",
    targetId: params.id,
    details: { email: invite.email, moveId: invite.moveId },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
