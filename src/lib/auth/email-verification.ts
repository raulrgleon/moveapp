import { randomInt, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const CODE_TTL_MS = 15 * 60 * 1000;
const REGISTER_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export function normalizeSignupEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidSignupEmail(email: string): boolean {
  const normalized = normalizeSignupEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export async function emailAlreadyRegistered(email: string): Promise<boolean> {
  const normalized = normalizeSignupEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  return Boolean(user);
}

function generateVerificationCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export async function createAndSendVerificationCode(
  email: string
): Promise<{ code: string; expiresAt: Date }> {
  const normalized = normalizeSignupEmail(email);
  const existing = await prisma.emailVerification.findFirst({
    where: { email: normalized },
    orderBy: { createdAt: "desc" },
  });

  if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime())) / 1000
    );
    throw new Error(`RESEND_COOLDOWN:${waitSec}`);
  }

  const code = generateVerificationCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.emailVerification.deleteMany({ where: { email: normalized } });
  await prisma.emailVerification.create({
    data: {
      email: normalized,
      codeHash,
      expiresAt,
      lastSentAt: new Date(),
    },
  });

  return { code, expiresAt };
}

export async function confirmVerificationCode(
  email: string,
  code: string
): Promise<{ registerToken: string; expiresAt: Date }> {
  const normalized = normalizeSignupEmail(email);
  const record = await prisma.emailVerification.findFirst({
    where: { email: normalized },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("NOT_FOUND");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new Error("EXPIRED");
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    throw new Error("TOO_MANY_ATTEMPTS");
  }

  const valid = await verifyPassword(code.trim(), record.codeHash);
  if (!valid) {
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("INVALID_CODE");
  }

  const registerToken = randomUUID();
  const registerTokenExpiresAt = new Date(Date.now() + REGISTER_TOKEN_TTL_MS);

  await prisma.emailVerification.update({
    where: { id: record.id },
    data: {
      verifiedAt: new Date(),
      registerToken,
      registerTokenExpiresAt,
    },
  });

  return { registerToken, expiresAt: registerTokenExpiresAt };
}

/** Validates and consumes a one-time register token for the given email. */
export async function consumeRegisterToken(
  email: string,
  registerToken: string
): Promise<boolean> {
  const normalized = normalizeSignupEmail(email);
  const token = registerToken.trim();
  if (!token) return false;

  const record = await prisma.emailVerification.findFirst({
    where: {
      email: normalized,
      registerToken: token,
      verifiedAt: { not: null },
    },
  });

  if (!record?.registerTokenExpiresAt) return false;
  if (record.registerTokenExpiresAt.getTime() < Date.now()) return false;

  await prisma.emailVerification.delete({ where: { id: record.id } });
  return true;
}
