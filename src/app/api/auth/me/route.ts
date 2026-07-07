import { NextRequest, NextResponse } from "next/server";
import { resolveTrialEndsAt } from "@/lib/billing/plan";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized(req);

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      username: true,
      phone: true,
      emailReminders: true,
      smsReminders: true,
      locale: true,
      createdAt: true,
      planTier: true,
      trialEndsAt: true,
      planPaidAt: true,
      stripeCustomerId: true,
      passwordHash: true,
    },
  });

  if (!user) return unauthorized(req);

  const { passwordHash, ...publicUser } = user;

  let trialEndsAt = publicUser.trialEndsAt;
  if (!trialEndsAt && publicUser.planTier !== "pro") {
    trialEndsAt = resolveTrialEndsAt({ createdAt: publicUser.createdAt, trialEndsAt: null });
  }

  return NextResponse.json({
    user: {
      ...publicUser,
      hasPassword: Boolean(passwordHash),
      locale: publicUser.locale ?? "en",
      trialEndsAt: trialEndsAt?.toISOString() ?? null,
      planPaidAt: publicUser.planPaidAt?.toISOString() ?? null,
      stripeCustomerId: publicUser.stripeCustomerId ?? null,
      createdAt: publicUser.createdAt.toISOString(),
    },
    impersonatedBy: session.impersonatedBy ?? null,
    isImpersonating: Boolean(session.impersonatedBy),
  });
}
