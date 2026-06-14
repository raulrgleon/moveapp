"use client";

import Link from "next/link";
import { Sparkles, Zap } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { useUtilityProviders } from "@/hooks/use-utility-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUtilityBestPicks,
  sumUtilityMonthlyEstimate,
} from "@/lib/utilities/recommendations";
import { formatCurrency } from "@/lib/utils";

export function DashboardUtilitiesCard() {
  const t = useT();
  const { isHydrated, profile } = useMove();
  const { providers, isPrecise, hasLocation, loading } = useUtilityProviders();

  const bestPicks = getUtilityBestPicks(providers);
  const estimatedMonthlyTotal = sumUtilityMonthlyEstimate(bestPicks);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {t("dashboardPage.utilitiesTitle")}
          </CardTitle>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/utilities">
              {isPrecise
                ? t("dashboardPage.viewAllServices")
                : hasLocation
                  ? t("dashboardPage.viewAllServices")
                  : t("dashboardPage.setUpAddress")}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isHydrated && hasLocation ? (
          <>
            {!isPrecise && (
              <p className="text-xs text-muted-foreground">
                {t("utilities.cityEstimateNote", { city: profile.destination.split(",")[0]?.trim() ?? profile.destination })}
              </p>
            )}
            {loading && providers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : bestPicks.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground break-words">
                  {t("dashboardPage.utilitiesEstimate", {
                    total: formatCurrency(estimatedMonthlyTotal),
                  })}
                </p>
                <ul className="space-y-2">
                  {bestPicks.map((pick) => (
                    <li
                      key={pick.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{pick.name}</span>
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {pick.estimatedMonthlyPrice != null
                          ? formatCurrency(pick.estimatedMonthlyPrice)
                          : "—"}
                        {pick.priceUnit ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("utilities.emptyProviders")}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("dashboardPage.utilitiesLocked")}</p>
        )}
      </CardContent>
    </Card>
  );
}
