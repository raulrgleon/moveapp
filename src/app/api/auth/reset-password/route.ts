import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllUserSessions } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = (await req.json()) as { token?: string; password?: string };
    if (!token?.trim() || !password?.trim() || password.length < 6) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const reset = await prisma.passwordResetToken.findUnique({
      where: { token: token.trim() },
      include: { user: true },
    });

    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    });
    await prisma.passwordResetToken.deleteMany({ where: { userId: reset.userId } });
    await destroyAllUserSessions(reset.userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
