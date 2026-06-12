import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "movepilot_session";
export const ADMIN_BACKUP_COOKIE = "movepilot_admin_backup";
const SESSION_DAYS = 30;

function getSecret() {
  const secret =
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev-movepilot-auth-secret-min-32-chars!!"
      : undefined);
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set (min 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

export { COOKIE_NAME };

export interface SessionPayload {
  userId: string;
  sessionId: string;
  email: string;
  role: string;
  impersonatedBy?: string;
}

export async function createSession(
  userId: string,
  email: string,
  role: string,
  options?: { impersonatedBy?: string }
) {
  const sessionId = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { userId, token: sessionId, expiresAt },
  });

  const jwtPayload: Record<string, string> = {
    sub: userId,
    sid: sessionId,
    email,
    role,
  };
  if (options?.impersonatedBy) {
    jwtPayload.imp = options.impersonatedBy;
  }

  const token = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  return { token, expiresAt, sessionId };
}

export async function validateSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub as string;
    const sessionId = payload.sid as string;
    if (!userId || !sessionId) return null;

    const session = await prisma.session.findUnique({
      where: { token: sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || session.userId !== userId) {
      return null;
    }

    if (session.user.suspendedAt) {
      return null;
    }

    return {
      userId,
      sessionId,
      email: session.user.email,
      role: session.user.role,
      impersonatedBy: (payload.imp as string | undefined) ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function destroySession(sessionId: string) {
  await prisma.session.deleteMany({ where: { token: sessionId } });
}

export async function destroyAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export function isSecureRequest(req: { headers: Headers; nextUrl?: { protocol: string } }): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;

  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";

  if (req.nextUrl) return req.nextUrl.protocol === "https:";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return appUrl.startsWith("https://");
}

export function sessionCookieOptions(expiresAt: Date, secure = false) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}
