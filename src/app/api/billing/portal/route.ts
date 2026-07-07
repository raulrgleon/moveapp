import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { appBaseUrl, getStripe } from "@/lib/billing/stripe";
import { ensureStripeCustomer } from "@/lib/billing/stripe-customer";

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized(req);

  const stripe = getStripe();
  if (!stripe) {
    return jsonErrorFromRequest(req, "configurationMissing", 503);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      planTier: true,
      stripeCustomerId: true,
    },
  });

  if (!user) return unauthorized(req);
  if (user.planTier !== "pro") {
    return NextResponse.json(
      { error: "Billing portal is available after upgrading to Pro" },
      { status: 400 }
    );
  }

  const customerId = await ensureStripeCustomer(user);
  if (!customerId) {
    return NextResponse.json({ error: "Could not open billing portal" }, { status: 500 });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appBaseUrl()}/settings`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("POST /api/billing/portal error:", error);
    return NextResponse.json({ error: "Billing portal unavailable" }, { status: 500 });
  }
}
