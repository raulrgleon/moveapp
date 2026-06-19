import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import {
  deleteMovingPartner,
  PARTNER_SPECIALTY_OPTIONS,
  updateMovingPartner,
} from "@/lib/partner/partner-store";

type RouteContext = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const body = (await req.json()) as {
    name?: string;
    regions?: string[];
    usdot?: string | null;
    rating?: number | null;
    yearsInBusiness?: number | null;
    specialties?: string[];
    website?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    notes?: string | null;
    active?: boolean;
    sortOrder?: number;
  };

  const partner = await updateMovingPartner(params.id, {
    ...body,
    specialties: body.specialties
      ? body.specialties.filter((s) =>
          (PARTNER_SPECIALTY_OPTIONS as readonly string[]).includes(s)
        )
      : undefined,
  });

  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "moving_partner.update",
    targetType: "moving_partner",
    targetId: partner.id,
    details: { name: partner.name, active: partner.active },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ partner });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const ok = await deleteMovingPartner(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  await logAdminAction({
    adminId: admin.id,
    action: "moving_partner.delete",
    targetType: "moving_partner",
    targetId: params.id,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
