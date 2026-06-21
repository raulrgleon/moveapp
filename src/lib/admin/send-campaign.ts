import type { Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { isValidE164Phone, normalizePhoneInput } from "@/lib/phone/normalize";
import { getNotificationConfigStatus } from "@/lib/notifications/config";
import { sendAdminCampaignEmail } from "@/lib/notifications/email";
import { sendTwilioSms } from "@/lib/notifications/twilio-config";
import { formatCampaignSmsError } from "@/lib/admin/twilio-campaign-errors";
import {
  applyNamePlaceholder,
  buildTemplatePreview,
  getCampaignTemplate,
  type CampaignChannel,
  type CampaignTemplateId,
} from "@/lib/admin/campaign-templates";

export type RecipientFilter = "all_clients" | "trial" | "pro";

export interface SendCampaignInput {
  channel: CampaignChannel;
  templateId: CampaignTemplateId;
  recipientMode: "all" | "selected";
  userIds?: string[];
  filter?: RecipientFilter;
  customSubject?: string;
  customBody?: string;
}

export interface CampaignSendResult {
  ok: boolean;
  sentEmail: number;
  sentSms: number;
  failedEmail: number;
  failedSms: number;
  skippedNoEmail: number;
  skippedNoPhone: number;
  skippedNoEmailOptIn: number;
  skippedNoSmsOptIn: number;
  skippedSuspended: number;
  totalRecipients: number;
  errors: string[];
}

const SEND_CONCURRENCY = 5;

function userLocale(locale: string | null): Locale {
  return locale === "es" ? "es" : "en";
}

export async function listCampaignRecipients() {
  return prisma.user.findMany({
    where: { role: { not: "admin" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      locale: true,
      planTier: true,
      suspendedAt: true,
      emailReminders: true,
      smsReminders: true,
    },
  });
}

async function resolveRecipients(input: SendCampaignInput) {
  const all = await listCampaignRecipients();
  const active = all.filter((u) => !u.suspendedAt);
  const suspendedSkipped = all.length - active.length;

  let pool = active;

  if (input.recipientMode === "selected") {
    const ids = new Set(input.userIds ?? []);
    pool = pool.filter((u) => ids.has(u.id));
  } else if (input.filter === "trial") {
    pool = pool.filter((u) => u.planTier === "trial");
  } else if (input.filter === "pro") {
    pool = pool.filter((u) => u.planTier === "pro");
  }

  return { pool, suspendedSkipped };
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    await Promise.all(chunk.map(fn));
  }
}

type PoolUser = Awaited<ReturnType<typeof resolveRecipients>>["pool"][number];

async function sendToUser(
  user: PoolUser,
  input: SendCampaignInput,
  needsEmail: boolean,
  needsSms: boolean,
  result: CampaignSendResult
) {
  const locale = userLocale(user.locale);
  const preview = buildTemplatePreview(input.templateId, locale, user.name, {
    subject: input.customSubject,
    body: input.customBody,
  });

  if (needsEmail) {
    if (!user.emailReminders) {
      result.skippedNoEmailOptIn += 1;
    } else if (!user.email?.trim()) {
      result.skippedNoEmail += 1;
    } else {
      const subject =
        input.templateId === "custom"
          ? applyNamePlaceholder(input.customSubject!.trim(), user.name)
          : preview.subject;
      const html =
        input.templateId === "custom"
          ? preview.html.includes("<")
            ? applyNamePlaceholder(input.customBody!.trim(), user.name)
            : preview.html
          : preview.html;

      const emailResult = await sendAdminCampaignEmail(user.email, subject, html);
      if (emailResult.ok) {
        result.sentEmail += 1;
      } else {
        result.failedEmail += 1;
        if (result.errors.length < 5) {
          result.errors.push(`Email failed for ${user.email}`);
        }
      }
    }
  }

  if (needsSms) {
    if (!user.smsReminders) {
      result.skippedNoSmsOptIn += 1;
    } else {
      const phone = user.phone ? normalizePhoneInput(user.phone) : null;
      if (!phone || !isValidE164Phone(phone)) {
        result.skippedNoPhone += 1;
      } else {
        const smsBody =
          input.templateId === "custom"
            ? applyNamePlaceholder(input.customBody!.trim(), user.name)
                .replace(/<[^>]+>/g, "")
                .slice(0, 320)
            : preview.sms;

        const smsResult = await sendTwilioSms(phone, smsBody);
        if (smsResult.ok) {
          result.sentSms += 1;
        } else {
          result.failedSms += 1;
          if (result.errors.length < 5) {
            const formatted = formatCampaignSmsError(
              user.name,
              smsResult.error ?? "unknown",
              locale
            );
            result.errors.push(formatted.message);
          }
        }
      }
    }
  }
}

export async function sendAdminCampaign(input: SendCampaignInput): Promise<CampaignSendResult> {
  const status = getNotificationConfigStatus();
  const needsEmail = input.channel === "email" || input.channel === "both";
  const needsSms = input.channel === "sms" || input.channel === "both";

  const emptyResult = (errors: string[]): CampaignSendResult => ({
    ok: false,
    sentEmail: 0,
    sentSms: 0,
    failedEmail: 0,
    failedSms: 0,
    skippedNoEmail: 0,
    skippedNoPhone: 0,
    skippedNoEmailOptIn: 0,
    skippedNoSmsOptIn: 0,
    skippedSuspended: 0,
    totalRecipients: 0,
    errors,
  });

  if (needsEmail && !status.email.configured) {
    return emptyResult(["Email not configured (RESEND_API_KEY missing)"]);
  }

  if (needsSms && !status.sms.configured) {
    return emptyResult(["SMS not configured (Twilio missing)"]);
  }

  if (input.templateId === "custom") {
    if (!input.customBody?.trim()) {
      return emptyResult(["Custom message body is required"]);
    }
    if (needsEmail && !input.customSubject?.trim()) {
      return emptyResult(["Custom email subject is required"]);
    }
  } else if (!getCampaignTemplate(input.templateId)) {
    return emptyResult(["Unknown template"]);
  }

  if (input.recipientMode === "selected" && !(input.userIds?.length ?? 0)) {
    return emptyResult(["Select at least one user"]);
  }

  const { pool, suspendedSkipped } = await resolveRecipients(input);
  const result: CampaignSendResult = {
    ok: true,
    sentEmail: 0,
    sentSms: 0,
    failedEmail: 0,
    failedSms: 0,
    skippedNoEmail: 0,
    skippedNoPhone: 0,
    skippedNoEmailOptIn: 0,
    skippedNoSmsOptIn: 0,
    skippedSuspended: suspendedSkipped,
    totalRecipients: pool.length,
    errors: [],
  };

  await mapPool(pool, SEND_CONCURRENCY, async (user) => {
    await sendToUser(user, input, needsEmail, needsSms, result);
  });

  result.ok = result.failedEmail === 0 && result.failedSms === 0;
  return result;
}
