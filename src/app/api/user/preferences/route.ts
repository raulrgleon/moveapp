import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

  const body = (await req.json()) as {
    phone?: string;
    emailReminders?: boolean;
    smsReminders?: boolean;
  };

  const data: {
    phone?: string | null;
    emailReminders?: boolean;
    smsReminders?: boolean;
  } = {};

  if (body.phone !== undefined) data.phone = body.phone.trim() || null;
  if (body.emailReminders !== undefined) data.emailReminders = body.emailReminders;
  if (body.smsReminders !== undefined) data.smsReminders = body.smsReminders;

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
    },
  });

  return NextResponse.json({ user });
}
