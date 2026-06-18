import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ensureStripeCustomer } from "@/lib/billing/stripe-customer";
import { appBaseUrl, getProPriceId, getStripe, isStripeCheckoutReady } from "@/lib/billing/stripe";

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

  if (!isStripeCheckoutReady()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, planTier: true, stripeCustomerId: true },
  });

  if (!user) return unauthorized();
  if (user.planTier === "pro") {
    return NextResponse.json({ error: "Already on Pro" }, { status: 400 });
  }

  const stripe = getStripe()!;
  const priceId = getProPriceId()!;
  const base = appBaseUrl();
  const customerId = await ensureStripeCustomer(user);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(customerId ? { customer: customerId } : { customer_email: user.email }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/upgrade?canceled=1`,
      metadata: {
        userId: user.id,
        product: "movepilot_pro",
      },
      client_reference_id: user.id,
      allow_promotion_codes: true,
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("POST /api/billing/checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
