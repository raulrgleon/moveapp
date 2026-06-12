import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { jsonError, resolveRequestLocale } from "@/lib/api-errors";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const locale = resolveRequestLocale(req);
  const user = await getSessionUser(req);
  if (!user) return unauthorized();

  try {
    const body = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const currentPassword = body.currentPassword?.trim();
    const newPassword = body.newPassword?.trim();
    const confirmPassword = body.confirmPassword?.trim();

    if (!currentPassword) return jsonError("passwordRequired", 400, locale);
    if (!newPassword || newPassword.length < 6) return jsonError("passwordTooShort", 400, locale);
    if (newPassword !== confirmPassword) return jsonError("passwordMismatch", 400, locale);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.passwordHash || !(await verifyPassword(currentPassword, dbUser.passwordHash))) {
      return jsonError("invalidPassword", 401, locale);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/user/change-password error:", error);
    return jsonError("saveFailed", 500, locale);
  }
}
