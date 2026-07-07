import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import {
  sendAdminCampaign,
  type RecipientFilter,
} from "@/lib/admin/send-campaign";
import type { CampaignChannel, CampaignTemplateId } from "@/lib/admin/campaign-templates";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const body = (await req.json()) as {
    channel?: CampaignChannel;
    templateId?: CampaignTemplateId;
    recipientMode?: "all" | "selected";
    userIds?: string[];
    filter?: RecipientFilter;
    customSubject?: string;
    customBody?: string;
  };

  if (!body.channel || !["sms", "email", "both"].includes(body.channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  if (!body.templateId) {
    return NextResponse.json({ error: "Template required" }, { status: 400 });
  }

  const result = await sendAdminCampaign({
    channel: body.channel,
    templateId: body.templateId,
    recipientMode: body.recipientMode === "selected" ? "selected" : "all",
    userIds: body.userIds,
    filter: body.filter ?? "all_clients",
    customSubject: body.customSubject,
    customBody: body.customBody,
  });

  await logAdminAction({
    adminId: admin.id,
    action: "outreach.send_campaign",
    details: {
      channel: body.channel,
      templateId: body.templateId,
      recipientMode: body.recipientMode ?? "all",
      filter: body.filter ?? "all_clients",
      selectedCount: body.userIds?.length ?? 0,
      ...result,
    },
    ipAddress: getClientIp(req),
  });

  if (!result.ok && result.sentEmail === 0 && result.sentSms === 0 && result.errors.length) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
