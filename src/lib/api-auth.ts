import { NextRequest, NextResponse } from "next/server";
import { validateSessionToken, COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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
