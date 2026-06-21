import { NextRequest, NextResponse } from "next/server";
import {
  createAndSendVerificationCode,
  emailAlreadyRegistered,
  isValidSignupEmail,
  normalizeSignupEmail,
} from "@/lib/auth/email-verification";
import { getClientIp } from "@/lib/admin/audit-log";
import { jsonError, resolveRequestLocale } from "@/lib/api-errors";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmailVerificationCode } from "@/lib/notifications/email";

export async function POST(req: NextRequest) {
  const locale = resolveRequestLocale(req);
  try {
    const ip = getClientIp(req) ?? "unknown";
    const ipLimit = await rateLimit(`verify-email:ip:${ip}`, 10, 60 * 60 * 1000);
    if (!ipLimit.ok) {
      return NextResponse.json(
        {
          errorKey: "verificationRateLimit",
          retryAfterSec: ipLimit.retryAfterSec ?? 3600,
        },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { email?: string; locale?: "en" | "es" };
    const email = body.email?.trim();
    if (!email) {
      return jsonError("emailRequired", 400, locale);
    }
    if (!isValidSignupEmail(email)) {
      return jsonError("validEmailRequired", 400, locale);
    }

    const normalized = normalizeSignupEmail(email);
    if (await emailAlreadyRegistered(normalized)) {
      return jsonError("userExists", 409, locale);
    }

    const mailLocale = body.locale === "es" ? "es" : locale;
    const { code } = await createAndSendVerificationCode(normalized);
    await sendEmailVerificationCode(normalized, code, mailLocale);

    return NextResponse.json({ ok: true, email: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("RESEND_COOLDOWN:")) {
      const waitSec = Number(message.split(":")[1]) || 60;
      return NextResponse.json(
        { errorKey: "verificationResendCooldown", waitSec },
        { status: 429 }
      );
    }
    console.error("verify-email send error:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
