import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin, unauthorized } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import {
  deleteUserByAdmin,
  updateUserByAdmin,
  type UserRole,
} from "@/lib/auth/user-service";

type RouteContext = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      username?: string | null;
      role?: UserRole;
      password?: string;
      suspended?: boolean;
    };

    const user = await updateUserByAdmin(params.id, body, admin.id);

    await logAdminAction({
      adminId: admin.id,
      action: body.password ? "user.reset_password" : "user.update",
      targetType: "user",
      targetId: params.id,
      details: {
        role: body.role,
        suspended: body.suspended,
        email: body.email,
      },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    const status =
      message.includes("not found") ? 404 :
      message.includes("already in use") || message.includes("Cannot") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  try {
    await deleteUserByAdmin(params.id, admin.id);

    await logAdminAction({
      adminId: admin.id,
      action: "user.delete",
      targetType: "user",
      targetId: params.id,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    const status =
      message.includes("not found") ? 404 :
      message.includes("Cannot") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
