import { prisma } from "@/lib/prisma";
import { resolveTrialEndsAt } from "@/lib/billing/plan";
import { buildDefaultMoveData } from "@/lib/db/move-service";
import { sendWelcomeEmail } from "@/lib/notifications/email";
import type { User } from "@prisma/client";

export type OAuthProvider = "google" | "apple";

export async function findOrCreateOAuthUser(input: {
  provider: OAuthProvider;
  providerId: string;
  email: string | null;
  name?: string | null;
}): Promise<{ user: User; isNewUser: boolean }> {
  const providerField = input.provider === "google" ? "googleId" : "appleId";

  let user = await prisma.user.findFirst({
    where: { [providerField]: input.providerId } as { googleId?: string; appleId?: string },
  });

  if (user) {
    return { user, isNewUser: false };
  }

  const normalizedEmail = input.email?.trim().toLowerCase() ?? null;

  if (normalizedEmail) {
    user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { [providerField]: input.providerId },
      });
      return { user, isNewUser: false };
    }
  }

  if (!normalizedEmail) {
    throw new Error("OAUTH_EMAIL_REQUIRED");
  }

  const trialEndsAt = resolveTrialEndsAt({ createdAt: new Date(), trialEndsAt: null });
  const displayName =
    input.name?.trim() ||
    normalizedEmail.split("@")[0] ||
    (input.provider === "apple" ? "Apple User" : "User");

  user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: displayName,
      [providerField]: input.providerId,
      role: "user",
      planTier: "trial",
      trialEndsAt,
      moves: { create: await buildDefaultMoveData() },
    },
  });

  const locale = user.locale === "es" ? "es" : "en";
  await sendWelcomeEmail(user.email, user.name, locale);

  return { user, isNewUser: true };
}
