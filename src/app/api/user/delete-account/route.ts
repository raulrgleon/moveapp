import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { jsonError, resolveRequestLocale } from "@/lib/api-errors";
import { verifyPassword } from "@/lib/auth/password";
import { destroyAllUserSessions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { deleteDocumentFile } from "@/lib/storage/documents";

async function parseDeleteBody(req: NextRequest): Promise<{
  password?: string;
  confirmEmail?: string;
}> {
  try {
    return (await req.json()) as { password?: string; confirmEmail?: string };
  } catch {
    return {};
  }
}

async function handleDeleteAccount(req: NextRequest) {
  const locale = resolveRequestLocale(req);
  const user = await getSessionUser(req);
  if (!user) return unauthorized(req);

  if (user.role === "admin") {
    return NextResponse.json(
      { error: "Delete admin accounts from the admin panel" },
      { status: 400 }
    );
  }

  try {
    const body = await parseDeleteBody(req);
    const password = body.password?.trim();
    const confirmEmail = body.confirmEmail?.trim().toLowerCase();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!dbUser) return jsonError("notFound", 404, locale);

    if (dbUser.passwordHash) {
      if (!password) {
        return jsonError("passwordRequired", 400, locale);
      }
      const valid = await verifyPassword(password, dbUser.passwordHash);
      if (!valid) {
        return jsonError("invalidPassword", 401, locale);
      }
    } else {
      const email = confirmEmail ?? password?.toLowerCase();
      if (!email || email !== dbUser.email.toLowerCase()) {
        return jsonError("emailConfirmMismatch", 400, locale);
      }
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
    return jsonError("deleteFailed", 500, locale);
  }
}

export async function POST(req: NextRequest) {
  return handleDeleteAccount(req);
}

export async function DELETE(req: NextRequest) {
  return handleDeleteAccount(req);
}
