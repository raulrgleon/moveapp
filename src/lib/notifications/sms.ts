import type { Locale } from "@/lib/i18n";

export async function sendTaskReminderSms(
  to: string,
  taskTitle: string,
  dueDate: string,
  locale: Locale = "en"
) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  const prefix = locale === "es" ? "MovePilotAi:" : "MovePilotAi reminder:";
  const dueLabel = locale === "es" ? "vence" : "due";

  if (!sid || !token || !from) {
    console.log(`[sms] Reminder to ${to}: ${taskTitle} ${dueLabel} ${dueDate}`);
    return;
  }

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `${prefix} "${taskTitle}" ${dueLabel} ${dueDate}`,
  });

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
}
