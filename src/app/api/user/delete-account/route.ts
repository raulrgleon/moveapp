import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { verifyPassword } from "@/lib/auth/password";
import { destroyAllUserSessions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { deleteDocumentFile } from "@/lib/storage/documents";

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return unauthorized();

  if (user.role === "admin") {
    return NextResponse.json({ error: "Delete admin accounts from the admin panel" }, { status: 400 });
  }

  try {
    const body = (await req.json()) as { password?: string };
    const password = body.password?.trim();
    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.passwordHash || !(await verifyPassword(password, dbUser.passwordHash))) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const docs = await prisma.document.findMany({
      where: { move: { userId: user.id }, storageKey: { not: null } },
      select: { storageKey: true },
    });
    for (const doc of docs) {
      if (doc.storageKey) await deleteDocumentFile(doc.storageKey);
    }

    await destroyAllUserSessions(user.id);
    await prisma.user.delete({ where: { id: user.id } });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("movepilot_session", "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (error) {
    console.error("DELETE /api/user/delete-account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
