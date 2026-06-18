export const TRIAL_DAYS = 3;
export const PRO_PRICE_USD = 29;

export type PlanTier = "trial" | "pro" | "preview";

export type PlanStatus = {
  tier: PlanTier;
  isPro: boolean;
  trialEndsAt: Date | null;
  trialDaysLeft: number;
  trialActive: boolean;
  trialExpired: boolean;
  canUpgrade: boolean;
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function resolveTrialEndsAt(input: {
  createdAt: Date;
  trialEndsAt?: Date | string | null;
}): Date {
  if (input.trialEndsAt) return new Date(input.trialEndsAt);
  return addDays(new Date(input.createdAt), TRIAL_DAYS);
}

export function getPlanStatus(input: {
  planTier?: string | null;
  trialEndsAt?: Date | string | null;
  createdAt: Date | string;
  role?: string | null;
}): PlanStatus {
  if (input.role === "admin") {
    return {
      tier: "pro",
      isPro: true,
      trialEndsAt: null,
      trialDaysLeft: 0,
      trialActive: false,
      trialExpired: false,
      canUpgrade: false,
    };
  }

  const tier = (input.planTier === "pro" ? "pro" : input.planTier === "preview" ? "preview" : "trial") as PlanTier;
  const createdAt = new Date(input.createdAt);
  const trialEndsAt = tier === "pro" ? null : resolveTrialEndsAt({ createdAt, trialEndsAt: input.trialEndsAt });
  const now = Date.now();
  const msLeft = trialEndsAt ? trialEndsAt.getTime() - now : 0;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000))) : 0;
  const trialActive = tier === "trial" && Boolean(trialEndsAt && msLeft > 0);
  const trialExpired = tier === "trial" && Boolean(trialEndsAt && msLeft <= 0);
  const isPro = tier === "pro" || trialActive;

  return {
    tier,
    isPro,
    trialEndsAt,
    trialDaysLeft,
    trialActive,
    trialExpired,
    canUpgrade: tier !== "pro",
  };
}

export function planDismissKey(userId: string): string {
  return `movepilot_upgrade_banner_${userId}`;
}

/** Show banner again after 24 hours if dismissed. */
export function shouldShowUpgradeBanner(userId: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(planDismissKey(userId));
  if (!raw) return true;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return true;
  return Date.now() - dismissedAt > 24 * 60 * 60 * 1000;
}

export function dismissUpgradeBanner(userId: string): void {
  localStorage.setItem(planDismissKey(userId), String(Date.now()));
}
