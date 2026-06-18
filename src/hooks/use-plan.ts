"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getPlanStatus, type PlanStatus } from "@/lib/billing/plan";

export function usePlan(): PlanStatus & { loading: boolean } {
  const { user, isHydrated, isAdmin } = useAuth();

  const status = useMemo(() => {
    if (!user?.createdAt) {
      return getPlanStatus({
        planTier: user?.planTier,
        trialEndsAt: user?.trialEndsAt,
        createdAt: new Date(),
        role: user?.role,
      });
    }
    return getPlanStatus({
      planTier: user.planTier,
      trialEndsAt: user.trialEndsAt,
      createdAt: user.createdAt,
      role: user.role,
    });
  }, [user?.createdAt, user?.planTier, user?.trialEndsAt, user?.role]);

  if (isAdmin) {
    return {
      tier: "pro",
      isPro: true,
      trialEndsAt: null,
      trialDaysLeft: 0,
      trialActive: false,
      trialExpired: false,
      canUpgrade: false,
      loading: !isHydrated,
    };
  }

  return { ...status, loading: !isHydrated };
}
