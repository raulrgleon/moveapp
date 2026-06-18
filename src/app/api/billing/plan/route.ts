import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getPlanStatus, TRIAL_DAYS } from "@/lib/billing/plan";
import { isStripeCheckoutReady } from "@/lib/billing/stripe";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@movepilotai.com";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      planTier: true,
      trialEndsAt: true,
      planPaidAt: true,
      createdAt: true,
      role: true,
    },
  });

  if (!user) return unauthorized();

  const plan = getPlanStatus(user);

  return NextResponse.json({
    ...plan,
    trialEndsAt: plan.trialEndsAt?.toISOString() ?? null,
    planPaidAt: user.planPaidAt?.toISOString() ?? null,
    priceUsd: 29,
    trialDays: TRIAL_DAYS,
    supportEmail: SUPPORT_EMAIL,
    checkoutAvailable: isStripeCheckoutReady(),
  });
}

/** @deprecated Use POST /api/billing/checkout */
export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { planTier: true },
  });

  if (!user) return unauthorized();
  if (user.planTier === "pro") {
    return NextResponse.json({ error: "Already on Pro" }, { status: 400 });
  }

  if (isStripeCheckoutReady()) {
    return NextResponse.json({ checkoutAvailable: true, useCheckout: true });
  }

  return NextResponse.json(
    { error: "Checkout not available", supportEmail: SUPPORT_EMAIL },
    { status: 503 }
  );
}
