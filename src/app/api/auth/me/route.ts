import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      username: true,
      phone: true,
      emailReminders: true,
      smsReminders: true,
      locale: true,
    },
  });

  return NextResponse.json({
    user: user ? { ...user, locale: user.locale ?? "en" } : user,
    impersonatedBy: session.impersonatedBy ?? null,
    isImpersonating: Boolean(session.impersonatedBy),
  });
}
