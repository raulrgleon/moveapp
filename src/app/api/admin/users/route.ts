import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin, unauthorized } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { listAllUsers, registerUserWithPassword } from "@/lib/auth/user-service";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return unauthorized();

  const users = await listAllUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  try {
    const { email, name, password, role, username } = (await req.json()) as {
      email?: string;
      name?: string;
      password?: string;
      role?: "user" | "admin";
      username?: string | null;
    };

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await registerUserWithPassword(
      email.trim(),
      name?.trim() || email.split("@")[0],
      password,
      role === "admin" ? "admin" : "user",
      username
    );

    await logAdminAction({
      adminId: admin.id,
      action: "user.create",
      targetType: "user",
      targetId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
