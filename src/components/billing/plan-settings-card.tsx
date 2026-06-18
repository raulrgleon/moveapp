"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Crown, Loader2 } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { usePlan } from "@/hooks/use-plan";
import { PRO_PRICE_USD } from "@/lib/billing/plan";
import { startStripeCheckout } from "@/lib/billing/start-checkout";
import { startStripePortal } from "@/lib/billing/start-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PRO_PERKS = [
  "upgrade.perk1",
  "upgrade.perk2",
  "upgrade.perk3",
  "upgrade.perk4",
  "upgrade.perk5",
] as const;

export function PlanSettingsCard() {
  const t = useT();
  const plan = usePlan();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = plan.isPro
    ? t("upgrade.statusPro")
    : plan.trialActive
      ? t("upgrade.statusTrial", { days: plan.trialDaysLeft })
      : plan.trialExpired
        ? t("upgrade.statusExpired")
        : t("upgrade.statusPreview");

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

  const handlePortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const result = await startStripePortal();
      if (!result.ok) setError(result.error);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <Card className={plan.canUpgrade ? "border-primary/30 shadow-sm" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              {t("upgrade.planTitle")}
            </CardTitle>
            <CardDescription>{t("upgrade.planDesc")}</CardDescription>
          </div>
          <Badge variant={plan.isPro ? "default" : "secondary"}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {plan.canUpgrade ? (
          <>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">{t("upgrade.proOffer")}</p>
              <p className="mt-1 text-2xl font-bold">
                ${PRO_PRICE_USD}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {t("pricing.proPeriod")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">{t("upgrade.proOfferNote")}</p>
            </div>
            <ul className="space-y-2 text-sm">
              {PRO_PERKS.map((key) => (
                <li key={key} className="flex gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={() => void handleUpgrade()} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {t("upgrade.upgradeCta")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/upgrade">{t("upgrade.viewDetails")}</Link>
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("upgrade.proActiveDesc")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handlePortal()}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("upgrade.manageBilling")
              )}
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
