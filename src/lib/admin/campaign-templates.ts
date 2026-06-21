import type { Locale } from "@/lib/i18n";

export type CampaignCategory = "promotion" | "reminder";
export type CampaignChannel = "sms" | "email" | "both";
export type CampaignTemplateId =
  | "promo_pro"
  | "promo_welcome_back"
  | "reminder_finish_setup"
  | "reminder_checklist"
  | "reminder_move_soon"
  | "custom";

export interface CampaignTemplateContext {
  name: string;
  locale: Locale;
  appUrl: string;
}

export interface CampaignTemplate {
  id: CampaignTemplateId;
  category: CampaignCategory;
  labelEn: string;
  labelEs: string;
  defaultChannel: CampaignChannel;
  buildEmail: (ctx: CampaignTemplateContext) => { subject: string; html: string };
  buildSms: (ctx: CampaignTemplateContext) => string;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://movepilotai.com";
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "promo_pro",
    category: "promotion",
    labelEn: "Promotion — Upgrade to MovePilot Pro",
    labelEs: "Promoción — Actualiza a MovePilot Pro",
    defaultChannel: "email",
    buildEmail: (ctx) => {
      const isEs = ctx.locale === "es";
      return {
        subject: isEs
          ? "Desbloquea MovePilot Pro para tu mudanza"
          : "Unlock MovePilot Pro for your move",
        html: isEs
          ? `<p>Hola ${ctx.name},</p><p>Planifica sin límites con <strong>MovePilot Pro</strong>: ruta avanzada, Pilot sin restricciones, presupuesto completo y más.</p><p><a href="${ctx.appUrl}/upgrade">Ver MovePilot Pro</a></p>`
          : `<p>Hi ${ctx.name},</p><p>Plan without limits with <strong>MovePilot Pro</strong>: advanced routing, full Pilot access, complete budget tools, and more.</p><p><a href="${ctx.appUrl}/upgrade">See MovePilot Pro</a></p>`,
      };
    },
    buildSms: (ctx) =>
      ctx.locale === "es"
        ? `MovePilotAi: Hola ${ctx.name}, desbloquea Pro para tu mudanza → ${ctx.appUrl}/upgrade`
        : `MovePilotAi: Hi ${ctx.name}, unlock Pro for your move → ${ctx.appUrl}/upgrade`,
  },
  {
    id: "promo_welcome_back",
    category: "promotion",
    labelEn: "Promotion — Come back and finish your plan",
    labelEs: "Promoción — Vuelve y termina tu plan",
    defaultChannel: "both",
    buildEmail: (ctx) => {
      const isEs = ctx.locale === "es";
      return {
        subject: isEs ? "Tu mudanza te espera en MovePilotAi" : "Your move is waiting on MovePilotAi",
        html: isEs
          ? `<p>Hola ${ctx.name},</p><p>Retoma tu plan de mudanza: checklist, presupuesto, ruta y Pilot te están esperando.</p><p><a href="${ctx.appUrl}/dashboard">Continuar en MovePilotAi</a></p>`
          : `<p>Hi ${ctx.name},</p><p>Pick up where you left off — checklist, budget, route, and Pilot are ready for you.</p><p><a href="${ctx.appUrl}/dashboard">Continue on MovePilotAi</a></p>`,
      };
    },
    buildSms: (ctx) =>
      ctx.locale === "es"
        ? `MovePilotAi: Hola ${ctx.name}, retoma tu plan de mudanza → ${ctx.appUrl}/dashboard`
        : `MovePilotAi: Hi ${ctx.name}, continue your move plan → ${ctx.appUrl}/dashboard`,
  },
  {
    id: "reminder_finish_setup",
    category: "reminder",
    labelEn: "Reminder — Complete your move setup",
    labelEs: "Recordatorio — Completa la configuración de tu mudanza",
    defaultChannel: "email",
    buildEmail: (ctx) => {
      const isEs = ctx.locale === "es";
      return {
        subject: isEs
          ? "MovePilotAi — pasos pendientes en tu mudanza"
          : "MovePilotAi — pending steps for your move",
        html: isEs
          ? `<p>Hola ${ctx.name},</p><p>Confirma origen/destino, elige camión y revisa utilities para estar listo.</p><p><a href="${ctx.appUrl}/onboarding">Completar configuración</a></p>`
          : `<p>Hi ${ctx.name},</p><p>Confirm origin/destination, choose your truck, and review utilities to stay on track.</p><p><a href="${ctx.appUrl}/onboarding">Complete setup</a></p>`,
      };
    },
    buildSms: (ctx) =>
      ctx.locale === "es"
        ? `MovePilotAi: ${ctx.name}, completa la config de tu mudanza → ${ctx.appUrl}/dashboard`
        : `MovePilotAi: ${ctx.name}, finish your move setup → ${ctx.appUrl}/dashboard`,
  },
  {
    id: "reminder_checklist",
    category: "reminder",
    labelEn: "Reminder — Check your checklist",
    labelEs: "Recordatorio — Revisa tu checklist",
    defaultChannel: "both",
    buildEmail: (ctx) => {
      const isEs = ctx.locale === "es";
      return {
        subject: isEs ? "MovePilotAi — tareas pendientes" : "MovePilotAi — tasks waiting for you",
        html: isEs
          ? `<p>Hola ${ctx.name},</p><p>Revisa tu checklist y marca lo que ya completaste.</p><p><a href="${ctx.appUrl}/checklist">Ver checklist</a></p>`
          : `<p>Hi ${ctx.name},</p><p>Review your checklist and mark what you've already done.</p><p><a href="${ctx.appUrl}/checklist">View checklist</a></p>`,
      };
    },
    buildSms: (ctx) =>
      ctx.locale === "es"
        ? `MovePilotAi: ${ctx.name}, revisa tu checklist → ${ctx.appUrl}/checklist`
        : `MovePilotAi: ${ctx.name}, check your checklist → ${ctx.appUrl}/checklist`,
  },
  {
    id: "reminder_move_soon",
    category: "reminder",
    labelEn: "Reminder — Your move is coming up",
    labelEs: "Recordatorio — Tu mudanza se acerca",
    defaultChannel: "both",
    buildEmail: (ctx) => {
      const isEs = ctx.locale === "es";
      return {
        subject: isEs ? "MovePilotAi — tu mudanza se acerca" : "MovePilotAi — your move is coming up",
        html: isEs
          ? `<p>Hola ${ctx.name},</p><p>Revisa ruta, inventario y tareas de último momento antes del día D.</p><p><a href="${ctx.appUrl}/move-day">Vista Move Day</a></p>`
          : `<p>Hi ${ctx.name},</p><p>Review route, inventory, and last-minute tasks before move day.</p><p><a href="${ctx.appUrl}/move-day">Open Move Day</a></p>`,
      };
    },
    buildSms: (ctx) =>
      ctx.locale === "es"
        ? `MovePilotAi: ${ctx.name}, tu mudanza se acerca — revisa Move Day → ${ctx.appUrl}/move-day`
        : `MovePilotAi: ${ctx.name}, move day is near — review Move Day → ${ctx.appUrl}/move-day`,
  },
];

export function getCampaignTemplate(id: CampaignTemplateId): CampaignTemplate | null {
  if (id === "custom") return null;
  return CAMPAIGN_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function applyNamePlaceholder(text: string, name: string): string {
  return text.replace(/\{\{name\}\}/g, name);
}

export function buildTemplatePreview(
  templateId: CampaignTemplateId,
  locale: Locale,
  name: string,
  custom?: { subject?: string; body?: string }
): { subject: string; html: string; sms: string } {
  const ctx: CampaignTemplateContext = {
    name,
    locale,
    appUrl: appUrl(),
  };

  if (templateId === "custom") {
    const body = applyNamePlaceholder(custom?.body?.trim() || "", name);
    const subject = applyNamePlaceholder(custom?.subject?.trim() || "MovePilotAi", name);
    const html = body.includes("<") ? body : `<p>${body.replace(/\n/g, "</p><p>")}</p>`;
    return { subject, html, sms: body.replace(/<[^>]+>/g, "").slice(0, 320) };
  }

  const template = getCampaignTemplate(templateId);
  if (!template) {
    return { subject: "", html: "", sms: "" };
  }

  const email = template.buildEmail(ctx);
  return { subject: email.subject, html: email.html, sms: template.buildSms(ctx) };
}

export function listCampaignTemplatesForApi() {
  return CAMPAIGN_TEMPLATES.map((t) => ({
    id: t.id,
    category: t.category,
    labelEn: t.labelEn,
    labelEs: t.labelEs,
    defaultChannel: t.defaultChannel,
  }));
}
