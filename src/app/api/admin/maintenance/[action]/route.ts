import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import { processDueReminders } from "@/lib/notifications/reminders";
import { getNotificationConfigStatus } from "@/lib/notifications/config";
import { sendWelcomeEmail } from "@/lib/notifications/email";
import { sendTestSms } from "@/lib/notifications/sms";
import { isValidE164Phone, normalizePhoneInput } from "@/lib/phone/normalize";
import { verifyTwilioConnection } from "@/lib/notifications/twilio-config";

type RouteContext = { params: { action: string } };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

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

  if (params.action === "verify-twilio") {
    const result = await verifyTwilioConnection();
    await logAdminAction({
      adminId: admin.id,
      action: "maintenance.verify_twilio",
      details: { ...result },
      ipAddress: getClientIp(req),
    });
    return NextResponse.json({
      ok: result.ok,
      error: result.error,
      status: result.status,
      config: getNotificationConfigStatus().sms,
    });
  }

  if (params.action === "test-sms") {
    const status = getNotificationConfigStatus();
    if (!status.sms.configured) {
      return NextResponse.json(
        { ok: false, error: "Twilio not configured", missing: status.sms.missing },
        { status: 400 }
      );
    }
    const body = (await req.json()) as { to?: string };
    const raw = body.to?.trim() || admin.phone?.trim();
    if (!raw) {
      return NextResponse.json({ ok: false, error: "Phone number required" }, { status: 400 });
    }
    const to = normalizePhoneInput(raw);
    if (!to || !isValidE164Phone(to)) {
      return NextResponse.json({ ok: false, error: "Invalid phone format. Use +15551234567" }, { status: 400 });
    }
    const result = await sendTestSms(to, admin.locale === "es" ? "es" : "en");
    await logAdminAction({
      adminId: admin.id,
      action: "maintenance.test_sms",
      details: { to, ...result },
      ipAddress: getClientIp(req),
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, status: result.status }, { status: 502 });
    }
    return NextResponse.json({ ok: true, to, sid: result.sid });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 404 });
}
