"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Crown, Loader2, Sparkles, X } from "lucide-react";
import { startStripeCheckout } from "@/lib/billing/start-checkout";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { usePlan } from "@/hooks/use-plan";
import { dismissUpgradeBanner, shouldShowUpgradeBanner } from "@/lib/billing/plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function UpgradeProBanner() {
  const t = useT();
  const { user } = useAuth();
  const plan = usePlan();
  const [visible, setVisible] = useState(true);

  const [checkingOut, setCheckingOut] = useState(false);

  if (plan.loading || !plan.canUpgrade || !user?.id) return null;
  if (!visible || !shouldShowUpgradeBanner(user.id)) return null;

  const messageKey = plan.trialExpired
    ? "upgrade.bannerExpired"
    : plan.trialActive
      ? "upgrade.bannerTrial"
      : "upgrade.bannerDefault";

  const dismiss = () => {
    dismissUpgradeBanner(user.id!);
    setVisible(false);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Crown className="h-5 w-5 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base">{t("upgrade.bannerTitle")}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t(messageKey, { days: plan.trialDaysLeft })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="shadow-sm"
            disabled={checkingOut}
            onClick={() => {
              setCheckingOut(true);
              void startStripeCheckout().finally(() => setCheckingOut(false));
            }}
          >
            {checkingOut ? t("upgrade.checkoutLoading") : t("upgrade.upgradeCta")}
            {!checkingOut && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dismiss} aria-label={t("upgrade.dismiss")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SidebarUpgradeCTA() {
  const t = useT();
  const plan = usePlan();

  if (plan.loading || !plan.canUpgrade) return null;

  return (
    <Link
      href="/upgrade"
      className="block rounded-lg border border-primary/25 bg-primary/5 p-3 transition-colors hover:bg-primary/10 hover:border-primary/40"
    >
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold">{t("upgrade.sidebarTitle")}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
        {plan.trialActive
          ? t("upgrade.sidebarTrial", { days: plan.trialDaysLeft })
          : t("upgrade.sidebarDefault")}
      </p>
    </Link>
  );
}
