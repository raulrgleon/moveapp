import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import {
  createMovingPartner,
  listAllMovingPartnersAdmin,
  PARTNER_SPECIALTY_OPTIONS,
} from "@/lib/partner/partner-store";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const partners = await listAllMovingPartnersAdmin();
  return NextResponse.json({ partners, specialtyOptions: PARTNER_SPECIALTY_OPTIONS });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const body = (await req.json()) as {
    name?: string;
    regions?: string[];
    usdot?: string;
    rating?: number;
    yearsInBusiness?: number;
    specialties?: string[];
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
    active?: boolean;
    sortOrder?: number;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const partner = await createMovingPartner({
    name: body.name,
    regions: body.regions ?? [],
    usdot: body.usdot ?? null,
    rating: body.rating ?? null,
    yearsInBusiness: body.yearsInBusiness ?? null,
    specialties: (body.specialties ?? []).filter((s) =>
      (PARTNER_SPECIALTY_OPTIONS as readonly string[]).includes(s)
    ),
    website: body.website ?? null,
    contactEmail: body.contactEmail ?? null,
    contactPhone: body.contactPhone ?? null,
    notes: body.notes ?? null,
    active: body.active ?? true,
    sortOrder: body.sortOrder ?? 0,
  });

  await logAdminAction({
    adminId: admin.id,
    action: "moving_partner.create",
    targetType: "moving_partner",
    targetId: partner.id,
    details: { name: partner.name },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ partner }, { status: 201 });
}
