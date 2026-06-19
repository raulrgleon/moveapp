"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Home, Loader2 } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import type { HousingMarketResponse } from "@/lib/rentcast/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardHousingCard() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useMove();
  const [data, setData] = useState<HousingMarketResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          origin: profile.origin,
          destination: profile.destination,
          household: profile.household?.trim() ?? "",
        });
        const res = await fetch(`/api/housing-market?${params.toString()}`);
        if (!res.ok) throw new Error("housing failed");
        const json = (await res.json()) as HousingMarketResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile.origin, profile.destination, profile.household]);

  const bedrooms = data?.housingContext?.recommendedBedrooms ?? 2;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            {t("dashboardPage.housingTitle")}
          </CardTitle>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/city-comparison">{t("dashboardPage.viewComparison")}</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("cityComparison.loading")}
          </div>
        ) : !data?.origin || !data?.destination ? (
          <p className="text-sm text-muted-foreground">{t("cityComparison.unavailable")}</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                {t("cityComparison.recommendedRent", { bedrooms })}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 min-w-0 text-sm">
                <span className="truncate min-w-0">
                  {formatCurrency(data.origin.recommendedRent ?? 0, locale)}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-semibold truncate min-w-0 text-right">
                  {formatCurrency(data.destination.recommendedRent ?? 0, locale)}
                </span>
              </div>
              {data.housingContext?.householdLabel && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {t("cityComparison.housingRecommendationForHousehold", {
                    household: data.housingContext.householdLabel,
                    bedrooms,
                  })}
                </p>
              )}
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">{t("cityComparison.medianHome")}</p>
              <div className="mt-2 flex items-center justify-between gap-2 min-w-0 text-sm">
                <span className="truncate min-w-0">
                  {formatCurrency(data.origin.medianHomePrice ?? 0, locale)}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-semibold truncate min-w-0 text-right">
                  {formatCurrency(data.destination.medianHomePrice ?? 0, locale)}
                </span>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                <Home className="h-3 w-3" />
                {t("cityComparison.attribution")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
