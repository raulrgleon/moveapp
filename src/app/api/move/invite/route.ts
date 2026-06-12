import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  createSession,
  isSecureRequest,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token?.trim()) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const collab = await prisma.moveCollaborator.findUnique({
      where: { inviteToken: token.trim() },
      include: { move: { include: { user: true } } },
    });

    if (!collab) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    let user = await prisma.user.findUnique({ where: { email: collab.email } });
    if (!user) {
      return NextResponse.json({
        error: "Account required",
        needsRegister: true,
        email: collab.email,
      }, { status: 403 });
    }

    await prisma.moveCollaborator.update({
      where: { id: collab.id },
      data: { userId: user.id, acceptedAt: new Date(), inviteToken: null },
    });

    const { token: sessionToken, expiresAt } = await createSession(
      user.id,
      user.email,
      user.role
    );

    const res = NextResponse.json({
      ok: true,
      move: {
        origin: collab.move.origin,
        destination: collab.move.destination,
        owner: collab.move.user.name,
      },
    });
    res.cookies.set(COOKIE_NAME, sessionToken, sessionCookieOptions(expiresAt, isSecureRequest(req)));
    return res;
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const collab = await prisma.moveCollaborator.findUnique({
    where: { inviteToken: token },
    include: { move: { include: { user: { select: { name: true } } } } },
  });

  if (!collab) return NextResponse.json({ error: "Invalid" }, { status: 404 });

  return NextResponse.json({
    email: collab.email,
    role: collab.role,
    ownerName: collab.move.user.name,
    origin: collab.move.origin,
    destination: collab.move.destination,
    accepted: Boolean(collab.acceptedAt),
  });
}
