import { logMoveActivity } from "@/lib/db/activity";
import { setActiveMove } from "@/lib/db/move-access";
import { prisma } from "@/lib/prisma";

export class InviteAcceptError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid"
      | "email_mismatch"
      | "already_accepted"
      | "needs_register"
  ) {
    super(message);
    this.name = "InviteAcceptError";
  }
}

export async function acceptMoveInviteByToken(token: string, userId: string) {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new InviteAcceptError("Token required", "invalid");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new InviteAcceptError("User not found", "invalid");
  }

  const collab = await prisma.moveCollaborator.findUnique({
    where: { inviteToken: trimmed },
    include: { move: { include: { user: { select: { name: true } } } } },
  });

  if (!collab) {
    throw new InviteAcceptError("Invalid invitation", "invalid");
  }

  if (collab.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new InviteAcceptError("Email does not match invitation", "email_mismatch");
  }

  if (collab.acceptedAt && collab.userId === userId) {
    await setActiveMove(userId, collab.moveId);
    return {
      moveId: collab.moveId,
      alreadyAccepted: true,
      ownerName: collab.move.user.name,
      origin: collab.move.origin,
      destination: collab.move.destination,
    };
  }

  if (collab.acceptedAt) {
    throw new InviteAcceptError("Invitation already used", "already_accepted");
  }

  await prisma.moveCollaborator.update({
    where: { id: collab.id },
    data: { userId: user.id, acceptedAt: new Date(), inviteToken: null },
  });

  await setActiveMove(user.id, collab.moveId);
  await logMoveActivity(collab.moveId, user.id, "invite_accepted", {
    email: user.email,
    name: user.name,
  });

  return {
    moveId: collab.moveId,
    alreadyAccepted: false,
    ownerName: collab.move.user.name,
    origin: collab.move.origin,
    destination: collab.move.destination,
  };
}
