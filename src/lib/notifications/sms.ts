export async function sendTaskReminderSms(to: string, taskTitle: string, dueDate: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.log(`[sms] Reminder to ${to}: ${taskTitle} due ${dueDate}`);
    return;
  }

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `MovePilot reminder: "${taskTitle}" due ${dueDate}`,
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
