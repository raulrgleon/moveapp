import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/billing/stripe";

export async function ensureStripeCustomer(user: {
  id: string;
  email: string;
  name: string;
  stripeCustomerId?: string | null;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
