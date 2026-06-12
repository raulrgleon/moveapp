import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireMoveAccess } from "@/lib/api-auth";
import { canManageCollaborators } from "@/lib/db/move-access";
import { prisma } from "@/lib/prisma";
import { sendMoveInviteEmail } from "@/lib/notifications/email";

export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;
  if (!canManageCollaborators(result.access.role)) {
    return NextResponse.json({ collaborators: [] });
  }

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    include: {
      collaborators: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!move) return NextResponse.json({ collaborators: [] });
  return NextResponse.json({ collaborators: move.collaborators });
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
  await sendMoveInviteEmail(inviteEmail, session.name, `${base}/invite/${inviteToken}`);

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
