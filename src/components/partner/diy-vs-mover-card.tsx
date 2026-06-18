"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useLocale, useT } from "@/contexts/locale-context";
import { compareDiyVsMover } from "@/lib/partner/quote-utils";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DiyVsMoverCardProps {
  diyEstimate: number;
  lowestQuote: number | null;
  compact?: boolean;
}

export function DiyVsMoverCard({ diyEstimate, lowestQuote, compact = false }: DiyVsMoverCardProps) {
  const t = useT();
  const { locale } = useLocale();
  const comparison = compareDiyVsMover(diyEstimate, lowestQuote);

  if (!diyEstimate) return null;

  return (
    <Card className={compact ? "border-dashed" : "border-primary/20 bg-primary/5"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("partnerPage.diyVsMoverTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{t("partnerPage.diyEstimate")}</p>
            <p className="text-xl font-bold">{formatCurrency(diyEstimate, locale)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("partnerPage.diyEstimateHint")}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{t("partnerPage.lowestQuote")}</p>
            <p className="text-xl font-bold">
              {lowestQuote != null ? formatCurrency(lowestQuote, locale) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lowestQuote != null
                ? t("partnerPage.lowestQuoteHint")
                : t("partnerPage.noQuotesYetHint")}
            </p>
          </div>
        </div>

        {comparison && (
          <div className="flex items-center gap-2 text-sm">
            {comparison.delta === 0 ? (
              <Minus className="h-4 w-4 text-muted-foreground" />
            ) : comparison.moverCheaper ? (
              <ArrowDown className="h-4 w-4 text-emerald-600" />
            ) : (
              <ArrowUp className="h-4 w-4 text-amber-600" />
            )}
            <span>
              {comparison.delta === 0
                ? t("partnerPage.sameCost")
                : comparison.moverCheaper
                  ? t("partnerPage.moverSaves", {
                      amount: formatCurrency(comparison.savings, locale),
                    })
                  : t("partnerPage.diySaves", {
                      amount: formatCurrency(comparison.savings, locale),
                    })}
            </span>
            {comparison.moverCheaper && (
              <Badge variant="secondary">{t("partnerPage.considerPro")}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
