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
import { jsonErrorFromRequest } from "@/lib/api-errors";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  locale?: string | null;
  impersonatedBy?: string;
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await validateSessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, locale: true, suspendedAt: true },
  });

  if (!user || user.suspendedAt) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    locale: user.locale,
    impersonatedBy: payload.impersonatedBy,
  };
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
  if (!user) return unauthorized(req);
  if (user.role === "admin") {
    return forbidden(req);
  }

  const access = await resolveMoveAccess(user.id);
  if (!access) {
    return jsonErrorFromRequest(req, "noMove", 404);
  }

  return { user, access };
}

export function requireMoveRole(
  access: MoveAccess,
  minRole: "viewer" | "editor" | "owner",
  req?: NextRequest
): NextResponse | null {
  const order: MoveAccessRole[] = ["viewer", "editor", "owner"];
  const current = order.indexOf(access.role);
  const required = order.indexOf(minRole);
  if (current < required) return forbidden(req);
  return null;
}

export function requireCanEditData(access: MoveAccess, req?: NextRequest): NextResponse | null {
  if (!canEditMoveData(access.role)) return forbidden(req);
  return null;
}

export function requireCanEditProfile(access: MoveAccess, req?: NextRequest): NextResponse | null {
  if (!canEditMoveProfile(access.role)) return forbidden(req);
  return null;
}

export function unauthorized(req?: NextRequest) {
  if (req) return jsonErrorFromRequest(req, "unauthorized", 401);
  return jsonErrorFromRequest(new Request("http://localhost"), "unauthorized", 401);
}

export function forbidden(req?: NextRequest) {
  if (req) return jsonErrorFromRequest(req, "forbidden", 403);
  return jsonErrorFromRequest(new Request("http://localhost"), "forbidden", 403);
}

export async function requireAdmin(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") return null;
  return prisma.user.findUnique({ where: { id: user.id } });
}
