import {
  getTwilioConfigStatus,
  isTwilioConfigured,
} from "@/lib/notifications/twilio-config";

export interface NotificationConfigStatus {
  email: { configured: boolean; from: string | null };
  sms: { configured: boolean; phone: string | null; missing: string[]; authMethod: string | null };
  cron: boolean;
  ready: boolean;
  missing: string[];
}

export function getNotificationConfigStatus(): NotificationConfigStatus {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim() ?? null;
  const twilio = getTwilioConfigStatus();
  const cron = Boolean(process.env.CRON_SECRET?.trim());

  const emailConfigured = Boolean(resendKey);
  const smsConfigured = isTwilioConfigured();

  const missing: string[] = [];
  if (!emailConfigured) missing.push("RESEND_API_KEY");
  if (!emailFrom) missing.push("EMAIL_FROM");
  if (!smsConfigured) missing.push(...twilio.missing.map((m) => `Twilio: ${m}`));
  if (!cron) missing.push("CRON_SECRET");

  return {
    email: { configured: emailConfigured, from: emailFrom },
    sms: {
      configured: smsConfigured,
      phone: twilio.phone,
      missing: twilio.missing,
      authMethod: twilio.authMethod,
    },
    cron,
    ready: emailConfigured && Boolean(emailFrom),
    missing,
  };
}
