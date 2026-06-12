import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { sendMoveInviteEmail } from "@/lib/notifications/email";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

  const move = await prisma.move.findFirst({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
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
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

  const { email, role } = (await req.json()) as { email?: string; role?: string };
  const inviteEmail = email?.trim().toLowerCase();
  if (!inviteEmail || !inviteEmail.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const move = await prisma.move.findFirst({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
  });
  if (!move) return NextResponse.json({ error: "No move found" }, { status: 404 });

  if (inviteEmail === session.email) {
    return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
  }

  const existing = await prisma.moveCollaborator.findUnique({
    where: { moveId_email: { moveId: move.id, email: inviteEmail } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already invited" }, { status: 409 });
  }

  const inviteToken = randomUUID();
  const collab = await prisma.moveCollaborator.create({
    data: {
      moveId: move.id,
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
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const move = await prisma.move.findFirst({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
  });
  if (!move) return unauthorized();

  await prisma.moveCollaborator.deleteMany({
    where: { id, moveId: move.id },
  });

  return NextResponse.json({ ok: true });
}
