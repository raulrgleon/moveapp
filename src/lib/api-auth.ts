import { NextRequest, NextResponse } from "next/server";
import { validateSessionToken, COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  canEditMoveData,
  canEditMoveProfile,
  resolveMoveAccess,
  type MoveAccess,
  type MoveAccessRole,
} from "@/lib/db/move-access";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await validateSessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
}

export async function getSessionEmail(req: NextRequest): Promise<string | null> {
  const user = await getSessionUser(req);
  return user?.email ?? null;
}

export async function requireMoveAccess(req: NextRequest): Promise<
  | { user: SessionUser; access: MoveAccess }
  | NextResponse
> {
  const user = await getSessionUser(req);
  if (!user) return unauthorized();
  if (user.role === "admin") {
    return forbidden();
  }

  const access = await resolveMoveAccess(user.id);
  if (!access) {
    return NextResponse.json({ error: "No move found" }, { status: 404 });
  }

  return { user, access };
}

export function requireMoveRole(
  access: MoveAccess,
  minRole: "viewer" | "editor" | "owner"
): NextResponse | null {
  const order: MoveAccessRole[] = ["viewer", "editor", "owner"];
  const current = order.indexOf(access.role);
  const required = order.indexOf(minRole);
  if (current < required) return forbidden();
  return null;
}

export function requireCanEditData(access: MoveAccess): NextResponse | null {
  if (!canEditMoveData(access.role)) return forbidden();
  return null;
}

export function requireCanEditProfile(access: MoveAccess): NextResponse | null {
  if (!canEditMoveProfile(access.role)) return forbidden();
  return null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireAdmin(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") return null;
  return prisma.user.findUnique({ where: { id: user.id } });
}
