import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { isValidE164Phone, normalizePhoneInput } from "@/lib/phone/normalize";

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

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
        return NextResponse.json(
          { error: "Invalid phone number. Use international format, e.g. +15551234567" },
          { status: 400 }
        );
      }
      data.phone = normalized;
    }
  }
  if (body.emailReminders !== undefined) data.emailReminders = body.emailReminders;
  if (body.smsReminders !== undefined) data.smsReminders = body.smsReminders;
  if (body.locale === "en" || body.locale === "es") data.locale = body.locale;

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
