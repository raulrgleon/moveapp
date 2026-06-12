import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_BACKUP_COOKIE,
  COOKIE_NAME,
  createSession,
  destroySession,
  isSecureRequest,
  sessionCookieOptions,
  validateSessionToken,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const { userId } = (await req.json()) as { userId?: string };
  if (!userId?.trim()) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role === "admin") {
    return NextResponse.json({ error: "Cannot impersonate this user" }, { status: 400 });
  }
  if (target.suspendedAt) {
    return NextResponse.json({ error: "User is suspended" }, { status: 400 });
  }

  const currentToken = req.cookies.get(COOKIE_NAME)?.value;
  if (!currentToken) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  const payload = await validateSessionToken(currentToken);
  if (!payload) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  if (payload.impersonatedBy) {
    return NextResponse.json({ error: "Already impersonating" }, { status: 400 });
  }

  const { token, expiresAt, sessionId } = await createSession(
    target.id,
    target.email,
    target.role,
    { impersonatedBy: admin.id }
  );

  await logAdminAction({
    adminId: admin.id,
    action: "user.impersonate",
    targetType: "user",
    targetId: target.id,
    details: { email: target.email },
    ipAddress: getClientIp(req),
  });

  const secure = isSecureRequest(req);
  const res = NextResponse.json({
    user: {
      id: target.id,
      email: target.email,
      name: target.name,
      role: target.role,
    },
  });
  res.cookies.set(ADMIN_BACKUP_COOKIE, currentToken, sessionCookieOptions(expiresAt, secure));
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions(expiresAt, secure));
  return res;
}

export async function DELETE(req: NextRequest) {
  const backupToken = req.cookies.get(ADMIN_BACKUP_COOKIE)?.value;
  if (!backupToken) {
    return NextResponse.json({ error: "Not impersonating" }, { status: 400 });
  }

  const currentToken = req.cookies.get(COOKIE_NAME)?.value;
  const currentPayload = currentToken ? await validateSessionToken(currentToken) : null;
  if (currentPayload?.sessionId) {
    await destroySession(currentPayload.sessionId);
  }

  const backupPayload = await validateSessionToken(backupToken);
  if (!backupPayload) {
    return NextResponse.json({ error: "Admin session expired" }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({ where: { id: backupPayload.userId } });
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ error: "Invalid admin session" }, { status: 401 });
  }

  if (backupPayload.impersonatedBy) {
    return NextResponse.json({ error: "Invalid backup session" }, { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const secure = isSecureRequest(req);
  const res = NextResponse.json({
    user: {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    },
  });
  res.cookies.set(COOKIE_NAME, backupToken, sessionCookieOptions(expiresAt, secure));
  res.cookies.set(ADMIN_BACKUP_COOKIE, "", { ...sessionCookieOptions(new Date(0), secure), maxAge: 0 });
  return res;
}
