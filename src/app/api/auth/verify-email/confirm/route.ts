import { NextRequest, NextResponse } from "next/server";
import {
  confirmVerificationCode,
  emailAlreadyRegistered,
  isValidSignupEmail,
  normalizeSignupEmail,
} from "@/lib/auth/email-verification";
import { jsonError, resolveRequestLocale } from "@/lib/api-errors";

export async function POST(req: NextRequest) {
  const locale = resolveRequestLocale(req);
  try {
    const body = (await req.json()) as { email?: string; code?: string };
    const email = body.email?.trim();
    const code = body.code?.trim();

    if (!email) {
      return jsonError("emailRequired", 400, locale);
    }
    if (!isValidSignupEmail(email)) {
      return jsonError("validEmailRequired", 400, locale);
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return jsonError("verificationCodeInvalid", 400, locale);
    }

    const normalized = normalizeSignupEmail(email);
    if (await emailAlreadyRegistered(normalized)) {
      return jsonError("userExists", 409, locale);
    }

    const { registerToken, expiresAt } = await confirmVerificationCode(normalized, code);

    return NextResponse.json({
      ok: true,
      email: normalized,
      registerToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_FOUND" || message === "INVALID_CODE") {
      return jsonError("verificationCodeInvalid", 400, locale);
    }
    if (message === "EXPIRED") {
      return jsonError("verificationCodeExpired", 400, locale);
    }
    if (message === "TOO_MANY_ATTEMPTS") {
      return jsonError("verificationTooManyAttempts", 429, locale);
    }
    console.error("verify-email confirm error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
