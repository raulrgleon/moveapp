import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import { processDueReminders } from "@/lib/notifications/reminders";
import { getNotificationConfigStatus } from "@/lib/notifications/config";
import { sendWelcomeEmail } from "@/lib/notifications/email";

type RouteContext = { params: { action: string } };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  if (params.action === "cleanup-sessions") {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    await logAdminAction({
      adminId: admin.id,
      action: "maintenance.cleanup_sessions",
      details: { deletedSessions: result.count },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true, deletedSessions: result.count });
  }

  if (params.action === "run-reminders") {
    const result = await processDueReminders();
    await logAdminAction({
      adminId: admin.id,
      action: "maintenance.run_reminders",
      details: result,
      ipAddress: getClientIp(req),
    });
    return NextResponse.json({ ok: true, ...result });
  }

  if (params.action === "notification-status") {
    return NextResponse.json(getNotificationConfigStatus());
  }

  if (params.action === "test-email") {
    const status = getNotificationConfigStatus();
    if (!status.email.configured) {
      return NextResponse.json({ ok: false, error: "RESEND_API_KEY not configured" }, { status: 400 });
    }
    const body = (await req.json()) as { to?: string };
    const to = body.to?.trim() || admin.email;
    await sendWelcomeEmail(to, admin.name, admin.locale === "es" ? "es" : "en");
    await logAdminAction({
      adminId: admin.id,
      action: "maintenance.test_email",
      details: { to },
      ipAddress: getClientIp(req),
    });
    return NextResponse.json({ ok: true, to });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 404 });
}
