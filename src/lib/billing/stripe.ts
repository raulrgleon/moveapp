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

export async function deactivateProForUser(userId: string): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, trialEndsAt: true },
  });
  if (!user) return;

  const { resolveTrialEndsAt } = await import("@/lib/billing/plan");
  const trialEndsAt = resolveTrialEndsAt({
    createdAt: user.createdAt,
    trialEndsAt: user.trialEndsAt,
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      planTier: "trial",
      planPaidAt: null,
      trialEndsAt,
    },
  });
}

export async function findUserIdByStripeCustomer(customerId: string): Promise<string | null> {
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
}
