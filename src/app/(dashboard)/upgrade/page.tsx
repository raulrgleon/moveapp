"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Crown, Loader2, Sparkles } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { useT } from "@/contexts/locale-context";
import { usePlan } from "@/hooks/use-plan";
import { PRO_PRICE_USD, TRIAL_DAYS } from "@/lib/billing/plan";
import { startStripeCheckout } from "@/lib/billing/start-checkout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  "upgrade.perk1",
  "upgrade.perk2",
  "upgrade.perk3",
  "upgrade.perk4",
  "upgrade.perk5",
  "upgrade.perk6",
] as const;

export default function UpgradePage() {
  const t = useT();
  const plan = usePlan();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await startStripeCheckout();
      if (!result.ok) setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardHeader title={t("upgrade.pageTitle")} description={t("upgrade.pageDesc")} />
      <PageContainer className="max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("upgrade.backDashboard")}
          </Link>
        </Button>

        <Card className="border-primary/30 overflow-hidden shadow-lg shadow-primary/10">
          <div className="h-1 bg-gradient-to-r from-brand-blue via-primary to-brand-accent" />
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                {t("pricing.trialBadge")}
              </Badge>
              {plan.trialActive && (
                <Badge variant="secondary">
                  {t("upgrade.statusTrial", { days: plan.trialDaysLeft })}
                </Badge>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Crown className="h-6 w-6" />
                <h2 className="font-display text-2xl sm:text-3xl font-bold">{t("pricing.proName")}</h2>
              </div>
              <p className="text-muted-foreground">{t("upgrade.pagePitch")}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold">${PRO_PRICE_USD}</span>
                <span className="text-muted-foreground">{t("pricing.proPeriod")}</span>
              </div>
              <p className="text-sm text-primary font-medium mt-2">
                {t("upgrade.trialIncluded", { days: TRIAL_DAYS })}
              </p>
            </div>

            <ul className="space-y-3">
              {FEATURES.map((key) => (
                <li key={key} className="flex gap-3 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0" strokeWidth={2.5} />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>

            {plan.canUpgrade ? (
              <div className="space-y-3 pt-2">
                <Button size="lg" className="w-full h-12 text-base shadow-md" onClick={() => void handleUpgrade()} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {t("upgrade.upgradeCtaPrice", { price: `$${PRO_PRICE_USD}` })}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">{t("upgrade.checkoutNoteStripe")}</p>
                {error && <p className="text-xs text-center text-destructive">{error}</p>}
                <Button variant="link" className="w-full" asChild>
                  <Link href="/pricing">{t("upgrade.comparePlans")}</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                {t("upgrade.proActiveDesc")}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
