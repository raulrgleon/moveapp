import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { activateProForUser, getStripe } from "@/lib/billing/stripe";

/** Fallback if webhook is delayed — verify session after redirect from Stripe. */
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return unauthorized();

  const sessionId = req.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = checkout.metadata?.userId || checkout.client_reference_id;

    if (userId !== sessionUser.id) {
      return NextResponse.json({ error: "Session does not match user" }, { status: 403 });
    }

    const paid =
      checkout.payment_status === "paid" || checkout.payment_status === "no_payment_required";

    if (paid) {
      await activateProForUser(userId);
    }

    return NextResponse.json({
      paid,
      planTier: paid ? "pro" : undefined,
    });
  } catch (error) {
    console.error("GET /api/billing/verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
