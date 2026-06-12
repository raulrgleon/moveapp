import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";
import { acceptMoveInviteByToken, InviteAcceptError } from "@/lib/move/accept-invite";
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

    let user = await getSessionUser(req);
    if (!user) {
      const collab = await prisma.moveCollaborator.findUnique({
        where: { inviteToken: token.trim() },
      });
      if (!collab) {
        return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
      }
      return NextResponse.json({
        error: "Account required",
        needsRegister: true,
        email: collab.email,
      }, { status: 403 });
    }

    const result = await acceptMoveInviteByToken(token, user.id);

    const { token: sessionToken, expiresAt } = await createSession(
      user.id,
      user.email,
      user.role
    );

    const res = NextResponse.json({
      ok: true,
      alreadyAccepted: result.alreadyAccepted,
      move: {
        origin: result.origin,
        destination: result.destination,
        owner: result.ownerName,
      },
    });
    res.cookies.set(COOKIE_NAME, sessionToken, sessionCookieOptions(expiresAt, isSecureRequest(req)));
    return res;
  } catch (error) {
    if (error instanceof InviteAcceptError) {
      if (error.code === "needs_register") {
        return NextResponse.json({ error: error.message, needsRegister: true }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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
