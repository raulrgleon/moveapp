import { NextRequest, NextResponse } from "next/server";
import { sendPartnerQuoteEmail } from "@/lib/notifications/email";
import {
  buildMoveBrief,
  estimateInventoryWeightLbs,
  PARTNER_SERVICE_TYPES,
} from "@/lib/partner/move-brief";
import { quoteAmountLabel } from "@/lib/partner/quote-utils";
import { drivenVehicleCount } from "@/lib/budget/fuel-cost";
import { parseRentalPreferenceKey } from "@/lib/move-profile";
import { resolveRouteDistanceMiles } from "@/lib/geo/route-service";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";

type RouteContext = { params: { token: string } };

function profileFromMove(move: {
  origin: string;
  destination: string;
  originLat: number | null;
  originLon: number | null;
  destinationLat: number | null;
  destinationLon: number | null;
  pets: boolean;
}) {
  return {
    name: "",
    email: "",
    origin: move.origin,
    destination: move.destination,
    moveDate: "",
    household: "",
    pets: move.pets,
    petDetails: "",
    budget: 0,
    rentalPreference: "",
    needsHousingHelp: false,
    needsVehicleTransport: false,
    originLat: move.originLat ?? undefined,
    originLon: move.originLon ?? undefined,
    destinationLat: move.destinationLat ?? undefined,
    destinationLon: move.destinationLon ?? undefined,
  };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const move = await prisma.move.findFirst({
    where: {
      partnerShareToken: params.token,
      partnerShareEnabled: true,
    },
    include: {
      inventoryBoxes: {
        select: { id: true, weightLbs: true, sizeEstimate: true, fragile: true },
      },
      checklistTasks: {
        where: { status: { not: "completed" } },
        select: { id: true },
      },
      budgetItems: { select: { estimated: true, category: true } },
      vehicles: {
        select: {
          id: true,
          displayLabel: true,
          make: true,
          model: true,
          needsTransport: true,
          combMpg: true,
        },
      },
    },
  });

  if (!move) {
    return NextResponse.json({ error: "Invalid or disabled link" }, { status: 404 });
  }

  const boxCount = move.inventoryBoxes.length;
  const fragileCount = move.inventoryBoxes.filter((b) => b.fragile).length;
  const estWeightLbs = Math.round(estimateInventoryWeightLbs(move.inventoryBoxes));
  const budgetEstimate = move.budgetItems.reduce((s, i) => s + i.estimated, 0);
  const fuelEstimate =
    move.budgetItems.find((i) => i.category.toLowerCase().includes("fuel"))?.estimated ?? 0;

  const profile = profileFromMove(move);
  const distanceMiles =
    (await resolveRouteDistanceMiles(profile, undefined, undefined, move.selectedRouteIndex ?? 0)) ??
    undefined;

  const drivingVehicleCount = drivenVehicleCount(
    parseRentalPreferenceKey(move.rentalPreference),
    Math.max(1, move.vehicles.length),
    move.vehicles.map((v) => ({
      id: v.id,
      year: "",
      makeId: 0,
      make: v.make,
      modelId: 0,
      model: v.model,
      displayLabel: v.displayLabel,
      needsTransport: v.needsTransport ?? false,
      combMpg: v.combMpg ?? undefined,
    }))
  );

  const brief = buildMoveBrief({
    origin: move.origin,
    destination: move.destination,
    moveDate: move.moveDate.toISOString().slice(0, 10),
    household: move.household,
    pets: move.pets,
    rentalPreference: move.rentalPreference,
    distanceMiles,
    boxCount,
    estWeightLbs,
    fragileCount,
    vehicleCount: move.vehicles.length,
    drivingVehicleCount,
    budgetEstimate: budgetEstimate || move.budget,
    diyEstimate: budgetEstimate || move.budget,
    fuelEstimate,
    pendingTasks: move.checklistTasks.length,
  });

  return NextResponse.json({
    ...brief,
    vehicleLabels: move.vehicles.map((v) => v.displayLabel),
    rentalPreference: move.rentalPreference,
    pendingTasks: move.checklistTasks.length,
    budgetEstimate: budgetEstimate || move.budget,
    serviceTypes: PARTNER_SERVICE_TYPES,
  });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const move = await prisma.move.findFirst({
    where: {
      partnerShareToken: params.token,
      partnerShareEnabled: true,
    },
    include: {
      user: { select: { email: true, name: true, locale: true } },
    },
  });

  if (!move) {
    return NextResponse.json({ error: "Invalid or disabled link" }, { status: 404 });
  }

  const body = (await req.json()) as {
    companyName?: string;
    contactEmail?: string;
    contactPhone?: string;
    amount?: number;
    amountMin?: number;
    amountMax?: number;
    message?: string;
    serviceType?: string;
    includesPacking?: boolean;
    includesInsurance?: boolean;
    usdotNumber?: string;
    availableDate?: string;
  };

  const companyName = body.companyName?.trim();
  const contactEmail = body.contactEmail?.trim().toLowerCase();

  if (!companyName || !contactEmail?.includes("@")) {
    return NextResponse.json({ error: "Company name and valid email required" }, { status: 400 });
  }

  const hasFixed = body.amount != null && body.amount > 0;
  const hasRange =
    (body.amountMin != null && body.amountMin > 0) ||
    (body.amountMax != null && body.amountMax > 0);

  if (!hasFixed && !hasRange) {
    return NextResponse.json({ error: "Quote amount or range required" }, { status: 400 });
  }

  if (
    body.serviceType &&
    !(PARTNER_SERVICE_TYPES as readonly string[]).includes(body.serviceType)
  ) {
    return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
  }

  const quote = await prisma.partnerQuote.create({
    data: {
      moveId: move.id,
      companyName,
      contactEmail,
      contactPhone: body.contactPhone?.trim() || null,
      amount: hasFixed ? Math.round(body.amount!) : null,
      amountMin: body.amountMin != null ? Math.round(body.amountMin) : null,
      amountMax: body.amountMax != null ? Math.round(body.amountMax) : null,
      message: body.message?.trim() || null,
      serviceType: body.serviceType?.trim() || null,
      includesPacking: body.includesPacking === true,
      includesInsurance: body.includesInsurance === true,
      usdotNumber: body.usdotNumber?.trim() || null,
      availableDate: body.availableDate?.trim() || null,
    },
  });

  const locale = (move.user.locale === "es" ? "es" : "en") as Locale;
  const amountLabel = quoteAmountLabel(
    {
      amount: quote.amount,
      amountMin: quote.amountMin,
      amountMax: quote.amountMax,
    },
    locale,
    (n) => `$${n.toLocaleString(locale === "es" ? "es-US" : "en-US")}`
  );

  void sendPartnerQuoteEmail(
    move.user.email,
    move.user.name,
    {
      companyName,
      amountLabel,
      origin: move.origin,
      destination: move.destination,
    },
    locale
  );

  return NextResponse.json({ ok: true, quoteId: quote.id }, { status: 201 });
}
