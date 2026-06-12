export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MovePilot <noreply@movepilot.ai>";

  if (!apiKey) {
    console.log(`[email] Password reset for ${to}: ${resetUrl}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your MovePilot password",
      html: `<p>Click to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Link expires in 2 hours.</p>`,
    }),
  });
}

export async function sendTaskReminderEmail(
  to: string,
  name: string,
  tasks: { title: string; dueDate: string }[]
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MovePilot <noreply@movepilot.ai>";
  const list = tasks.map((t) => `<li>${t.title} — due ${t.dueDate}</li>`).join("");

  if (!apiKey) {
    console.log(`[email] Reminder for ${to}:`, tasks);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "MovePilot — tasks due soon",
      html: `<p>Hi ${name},</p><p>Upcoming move tasks:</p><ul>${list}</ul>`,
    }),
  });
}

export async function sendMoveInviteEmail(to: string, inviterName: string, inviteUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MovePilot <noreply@movepilot.ai>";

  if (!apiKey) {
    console.log(`[email] Invite for ${to}: ${inviteUrl}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${inviterName} invited you to collaborate on a move`,
      html: `<p>${inviterName} invited you to help plan a move on MovePilot.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
    }),
  });
}
