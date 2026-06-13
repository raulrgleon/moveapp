import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireMoveAccess } from "@/lib/api-auth";
import { logMoveActivity } from "@/lib/db/activity";
import { canManageCollaborators } from "@/lib/db/move-access";
import { prisma } from "@/lib/prisma";
import { sendMoveInviteEmail } from "@/lib/notifications/email";

export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    include: {
      user: { select: { name: true, email: true } },
      collaborators: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!move) {
    return NextResponse.json({ owner: null, collaborators: [], canManage: false });
  }

  return NextResponse.json({
    owner: {
      name: move.user.name,
      email: move.user.email,
      role: "owner",
    },
    collaborators: move.collaborators,
    canManage: canManageCollaborators(result.access.role),
  });
}

export async function POST(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;
  if (!canManageCollaborators(result.access.role)) {
    return NextResponse.json({ error: "Only the move owner can invite collaborators" }, { status: 403 });
  }

  const session = result.user;
  const { email, role } = (await req.json()) as { email?: string; role?: string };
  const inviteEmail = email?.trim().toLowerCase();
  if (!inviteEmail || !inviteEmail.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const moveId = result.access.moveId;
  if (inviteEmail === session.email) {
    return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
  }

  const existing = await prisma.moveCollaborator.findUnique({
    where: { moveId_email: { moveId, email: inviteEmail } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already invited" }, { status: 409 });
  }

  const inviteToken = randomUUID();
  const collab = await prisma.moveCollaborator.create({
    data: {
      moveId,
      email: inviteEmail,
      role: role === "viewer" ? "viewer" : "editor",
      inviteToken,
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendMoveInviteEmail(
    inviteEmail,
    session.name,
    `${base}/invite/${inviteToken}`,
    session.locale === "es" ? "es" : "en"
  );
  await logMoveActivity(moveId, session.id, "invite_sent", {
    email: inviteEmail,
    role: collab.role,
  });

  return NextResponse.json({ collaborator: collab }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;
  if (!canManageCollaborators(result.access.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const collab = await prisma.moveCollaborator.findFirst({
    where: { id, moveId: result.access.moveId },
  });
  if (collab) {
    await logMoveActivity(result.access.moveId, result.user.id, "invite_removed", {
      email: collab.email,
    });
  }

  await prisma.moveCollaborator.deleteMany({
    where: { id, moveId: result.access.moveId },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;
  if (!canManageCollaborators(result.access.role)) {
    return NextResponse.json({ error: "Only the move owner can update collaborators" }, { status: 403 });
  }

  const { id, role } = (await req.json()) as { id?: string; role?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const nextRole = role === "viewer" ? "viewer" : "editor";
  const updated = await prisma.moveCollaborator.updateMany({
    where: { id, moveId: result.access.moveId },
    data: { role: nextRole },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, role: nextRole });
}
