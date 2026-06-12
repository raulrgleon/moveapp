"use client";

import Link from "next/link";
import { Sparkles, Zap } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DESTINATION_UTILITIES } from "@/lib/mock-data";
import {
  getUtilityBestPicks,
  sumUtilityMonthlyEstimate,
} from "@/lib/utilities/recommendations";
import { formatCurrency } from "@/lib/utils";

export function DashboardUtilitiesCard() {
  const t = useT();
  const { isAddressConfirmed, destinationAddress, isHydrated } = useMove();

  const bestPicks = getUtilityBestPicks(DESTINATION_UTILITIES);
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
              {isAddressConfirmed
                ? t("dashboardPage.viewAllServices")
                : t("dashboardPage.setUpAddress")}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isHydrated && isAddressConfirmed ? (
          <>
            <p className="text-sm text-muted-foreground break-words">
              {destinationAddress}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {bestPicks.slice(0, 4).map((pick) => (
                <div
                  key={pick.id}
                  className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                >
                  <p className="text-xs text-muted-foreground">{pick.categoryLabel}</p>
                  <p className="font-medium mt-0.5 truncate">{pick.name}</p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {formatCurrency(pick.estimatedMonthlyPrice)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      {pick.priceUnit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="break-words">
                {t("utilities.estMonthlyTotal")}: {formatCurrency(estimatedMonthlyTotal)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("dashboardPage.utilitiesLocked")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
