export interface NotificationConfigStatus {
  email: { configured: boolean; from: string | null };
  sms: { configured: boolean; phone: string | null };
  cron: boolean;
  ready: boolean;
  missing: string[];
}

export function getNotificationConfigStatus(): NotificationConfigStatus {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim() ?? null;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER?.trim() ?? null;
  const cron = Boolean(process.env.CRON_SECRET?.trim());

  const emailConfigured = Boolean(resendKey);
  const smsConfigured = Boolean(twilioSid && twilioToken && twilioPhone);

  const missing: string[] = [];
  if (!emailConfigured) missing.push("RESEND_API_KEY");
  if (!emailFrom) missing.push("EMAIL_FROM");
  if (!smsConfigured) missing.push("TWILIO_*");
  if (!cron) missing.push("CRON_SECRET");

  return {
    email: { configured: emailConfigured, from: emailFrom },
    sms: { configured: smsConfigured, phone: twilioPhone },
    cron,
    ready: emailConfigured && Boolean(emailFrom),
    missing,
  };
}
