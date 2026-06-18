import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getPlanStatus, type PlanStatus } from "@/lib/billing/plan";

export type ProAuth = {
  user: SessionUser;
  plan: PlanStatus;
};

export function paywallResponse(plan: PlanStatus): NextResponse {
  return NextResponse.json(
    {
      error: "Pro subscription required",
      code: "UPGRADE_REQUIRED",
      trialExpired: plan.trialExpired,
      trialDaysLeft: plan.trialDaysLeft,
    },
    { status: 402 }
  );
}

/** Requires an authenticated user with active Pro or trial. Admins always pass. */
export async function requireProSubscription(
  req: NextRequest
): Promise<ProAuth | NextResponse> {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "admin") {
    return {
      user: session,
      plan: {
        tier: "pro",
        isPro: true,
        trialEndsAt: null,
        trialDaysLeft: 0,
        trialActive: false,
        trialExpired: false,
        canUpgrade: false,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      planTier: true,
      trialEndsAt: true,
      createdAt: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = getPlanStatus(user);
  if (!plan.isPro) {
    return paywallResponse(plan);
  }

  return { user: session, plan };
}
