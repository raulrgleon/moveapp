import { NextRequest, NextResponse } from "next/server";
import { requireMoveAccess } from "@/lib/api-auth";
import { canManageCollaborators } from "@/lib/db/move-access";
import { prisma } from "@/lib/prisma";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { sendMoveInviteEmail } from "@/lib/notifications/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;
  if (!canManageCollaborators(result.access.role)) {
    return NextResponse.json({ error: "Only the move owner can resend invitations" }, { status: 403 });
  }

  const collab = await prisma.moveCollaborator.findFirst({
    where: { id: params.id, moveId: result.access.moveId },
  });
  if (!collab) {
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
  }
  if (collab.acceptedAt) {
    return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
  }
  if (!collab.inviteToken) {
    return NextResponse.json({ error: "No invite token" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendMoveInviteEmail(
    collab.email,
    result.user.name,
    `${base}/invite/${collab.inviteToken}`,
    result.user.locale === "es" ? "es" : "en"
  );

  return NextResponse.json({ ok: true });
}
