import { NextRequest, NextResponse } from "next/server";
import { resolveTrialEndsAt } from "@/lib/billing/plan";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorized();

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
    },
  });

  if (!user) return unauthorized();

  let trialEndsAt = user.trialEndsAt;
  if (!trialEndsAt && user.planTier !== "pro") {
    trialEndsAt = resolveTrialEndsAt({ createdAt: user.createdAt, trialEndsAt: null });
  }

  return NextResponse.json({
    user: user
      ? {
          ...user,
          locale: user.locale ?? "en",
          trialEndsAt: trialEndsAt?.toISOString() ?? null,
          planPaidAt: user.planPaidAt?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
        }
      : user,
    impersonatedBy: session.impersonatedBy ?? null,
    isImpersonating: Boolean(session.impersonatedBy),
  });
}
