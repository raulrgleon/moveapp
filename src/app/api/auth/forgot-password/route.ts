import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/notifications/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const normalized = email?.trim().toLowerCase();
    if (!normalized) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (user?.passwordHash) {
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendPasswordResetEmail(normalized, `${base}/reset-password?token=${token}`);
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists, a reset link was sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
