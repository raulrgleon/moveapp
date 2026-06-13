import type { Locale } from "@/lib/i18n";

type EmailLocale = Locale;

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || "MovePilotAi <noreply@movepilotai.com>";
}

async function sendHtmlEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email] ${subject} → ${to}`);
    return { ok: false as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      subject,
      html,
    }),
  });

  return { ok: res.ok };
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  locale: EmailLocale = "en"
) {
  const base = appUrl();
  const subject = locale === "es" ? "Bienvenido a MovePilotAi" : "Welcome to MovePilotAi";
  const greeting = locale === "es" ? `Hola ${name},` : `Hi ${name},`;
  const body =
    locale === "es"
      ? `<p>${greeting}</p><p>Tu cuenta está lista. Empieza a planificar tu mudanza:</p><p><a href="${base}/dashboard">${base}/dashboard</a></p>`
      : `<p>${greeting}</p><p>Your account is ready. Start planning your move:</p><p><a href="${base}/dashboard">${base}/dashboard</a></p>`;

  await sendHtmlEmail(to, subject, body);
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  locale: EmailLocale = "en"
) {
  const subject =
    locale === "es" ? "Restablece tu contraseña de MovePilotAi" : "Reset your MovePilotAi password";
  const body =
    locale === "es"
      ? `<p>Haz clic para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>El enlace expira en 2 horas.</p>`
      : `<p>Click to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Link expires in 2 hours.</p>`;

  await sendHtmlEmail(to, subject, body);
}

export async function sendTaskReminderEmail(
  to: string,
  name: string,
  tasks: { title: string; dueDate: string }[],
  locale: EmailLocale = "en"
) {
  const list = tasks
    .map((task) =>
      locale === "es"
        ? `<li>${task.title} — vence ${task.dueDate}</li>`
        : `<li>${task.title} — due ${task.dueDate}</li>`
    )
    .join("");

  const subject =
    locale === "es" ? "MovePilotAi — tareas próximas a vencer" : "MovePilotAi — tasks due soon";
  const body =
    locale === "es"
      ? `<p>Hola ${name},</p><p>Próximas tareas de tu mudanza:</p><ul>${list}</ul><p><a href="${appUrl()}/checklist">Ver checklist</a></p>`
      : `<p>Hi ${name},</p><p>Upcoming move tasks:</p><ul>${list}</ul><p><a href="${appUrl()}/checklist">View checklist</a></p>`;

  await sendHtmlEmail(to, subject, body);
}

export async function sendMoveInviteEmail(
  to: string,
  inviterName: string,
  inviteUrl: string,
  locale: EmailLocale = "en"
) {
  const subject =
    locale === "es"
      ? `${inviterName} te invitó a colaborar en MovePilotAi`
      : `${inviterName} invited you to collaborate on MovePilotAi`;
  const body =
    locale === "es"
      ? `<p>${inviterName} te invitó a ayudar a planificar una mudanza en <strong>MovePilotAi</strong>.</p><p><a href="${inviteUrl}">Aceptar invitación</a></p><p>Puedes actualizar el checklist, el presupuesto y mantenerte al día con tu equipo.</p>`
      : `<p>${inviterName} invited you to help plan a move on <strong>MovePilotAi</strong>.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>You can update the checklist, track budget, and stay in sync with your move team.</p>`;

  await sendHtmlEmail(to, subject, body);
}
