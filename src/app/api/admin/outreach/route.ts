import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { listCampaignRecipients } from "@/lib/admin/send-campaign";
import { listCampaignTemplatesForApi } from "@/lib/admin/campaign-templates";
import { getNotificationConfigStatus } from "@/lib/notifications/config";
import { getTwilioAccountMeta, isTwilioTrialAccount } from "@/lib/notifications/twilio-config";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const users = await listCampaignRecipients();
  const config = getNotificationConfigStatus();
  const twilioMeta = config.sms.configured ? await getTwilioAccountMeta() : null;

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      locale: u.locale,
      planTier: u.planTier,
      suspended: Boolean(u.suspendedAt),
      hasPhone: Boolean(u.phone?.trim()),
      emailReminders: u.emailReminders,
      smsReminders: u.smsReminders,
    })),
    templates: listCampaignTemplatesForApi(),
    config: {
      ...config,
      sms: {
        ...config.sms,
        trialAccount: twilioMeta?.ok ? isTwilioTrialAccount(twilioMeta.accountType) : null,
        accountType: twilioMeta?.accountType ?? null,
      },
    },
  });
}
