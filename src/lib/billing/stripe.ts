import Stripe from "stripe";
import { runtimeEnv } from "@/lib/runtime-env";

let client: Stripe | null = null;
let clientKey: string | null = null;

export function getStripe(): Stripe | null {
  const key = runtimeEnv("STRIPE_SECRET_KEY");
  if (!key) return null;
  if (!client || clientKey !== key) {
    client = new Stripe(key);
    clientKey = key;
  }
  return client;
}

export function getProPriceId(): string | null {
  return runtimeEnv("STRIPE_PRO_PRICE_ID") ?? null;
}

export function getStripeWebhookSecret(): string | null {
  return runtimeEnv("STRIPE_WEBHOOK_SECRET") ?? null;
}

export function isStripeCheckoutReady(): boolean {
  return Boolean(getStripe() && getProPriceId());
}

export function appBaseUrl(): string {
  return runtimeEnv("NEXT_PUBLIC_APP_URL") ?? "https://movepilotai.com";
}

export async function activateProForUser(
  userId: string,
  stripeCustomerId?: string | null
): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  await prisma.user.update({
    where: { id: userId },
    data: {
      planTier: "pro",
      planPaidAt: new Date(),
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
    },
  });
}
