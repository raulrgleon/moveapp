import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { jsonError, resolveRequestLocale } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { isValidE164Phone, normalizePhoneInput } from "@/lib/phone/normalize";

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized(req);

  const locale = resolveRequestLocale(req);
  const body = (await req.json()) as {
    phone?: string;
    emailReminders?: boolean;
    smsReminders?: boolean;
    locale?: string;
  };

  const data: {
    phone?: string | null;
    emailReminders?: boolean;
    smsReminders?: boolean;
    locale?: string;
  } = {};

  if (body.phone !== undefined) {
    const raw = body.phone.trim();
    if (!raw) {
      data.phone = null;
    } else {
      const normalized = normalizePhoneInput(raw);
      if (!normalized || !isValidE164Phone(normalized)) {
        return jsonError("phoneInvalid", 400, locale);
      }
      data.phone = normalized;
    }
  }
  if (body.emailReminders !== undefined) data.emailReminders = body.emailReminders;
  if (body.smsReminders !== undefined) data.smsReminders = body.smsReminders;
  if (body.locale === "en" || body.locale === "es") data.locale = body.locale;

  const current = await prisma.user.findUnique({
    where: { id: session.id },
    select: { phone: true },
  });
  if (!current) return unauthorized(req);

  const effectivePhone =
    data.phone !== undefined ? data.phone : current.phone?.trim() || null;

  if (body.smsReminders === true && !effectivePhone) {
    return jsonError("phoneRequired", 400, locale);
  }

  if (data.phone === null && body.smsReminders === undefined) {
    const userWithSms = await prisma.user.findUnique({
      where: { id: session.id },
      select: { smsReminders: true },
    });
    if (userWithSms?.smsReminders) {
      return jsonError("phoneRequired", 400, locale);
    }
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      emailReminders: true,
      smsReminders: true,
      locale: true,
    },
  });

  return NextResponse.json({ user });
}
