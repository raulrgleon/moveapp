import type { Locale } from "@/lib/i18n";
import { sendTwilioSms } from "@/lib/notifications/twilio-config";

export async function sendTaskReminderSms(
  to: string,
  taskTitle: string,
  dueDate: string,
  locale: Locale = "en"
) {
  const prefix = locale === "es" ? "MovePilotAi:" : "MovePilotAi reminder:";
  const dueLabel = locale === "es" ? "vence" : "due";
  const body = `${prefix} "${taskTitle}" ${dueLabel} ${dueDate}`;

  const result = await sendTwilioSms(to, body);
  if (!result.ok) {
    if (result.error === "Twilio not configured") {
      console.log(`[sms] Reminder to ${to}: ${body}`);
      return result;
    }
    console.error(`[sms] Twilio error: ${result.error}`);
    return result;
  }

  return result;
}

export async function sendTestSms(to: string, locale: Locale = "en") {
  const body =
    locale === "es"
      ? "MovePilotAi: SMS de prueba — tus recordatorios están configurados."
      : "MovePilotAi: test SMS — your reminders are configured.";
  return sendTwilioSms(to, body);
}
