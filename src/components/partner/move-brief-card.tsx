"use client";

import { useLocale, useT } from "@/contexts/locale-context";
import type { MoveBrief } from "@/lib/partner/move-brief";
import { complexityLabel } from "@/lib/partner/move-brief";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MoveBriefCardProps {
  brief: MoveBrief;
}

export function MoveBriefCard({ brief }: MoveBriefCardProps) {
  const t = useT();
  const { locale } = useLocale();

  const complexityVariant =
    brief.complexity === "complex"
      ? "destructive"
      : brief.complexity === "moderate"
        ? "secondary"
        : "outline";

  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{t("partnerPage.briefTitle")}</CardTitle>
          <Badge variant={complexityVariant}>{complexityLabel(brief.complexity, locale)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        {brief.distanceMiles != null && (
          <p>
            <span className="text-muted-foreground">{t("partnerPage.briefDistance")}:</span>{" "}
            {brief.distanceMiles.toLocaleString()} mi
            {brief.durationHours != null && ` · ~${Math.round(brief.durationHours)}h`}
          </p>
        )}
        <p>
          <span className="text-muted-foreground">{t("partnerPage.briefPreference")}:</span>{" "}
          {brief.rentalPreferenceLabel}
        </p>
        <p>
          <span className="text-muted-foreground">{t("partnerPage.briefInventory")}:</span>{" "}
          {t("partnerQuote.boxCount", { count: brief.boxCount, weight: brief.estWeightLbs })}
          {brief.fragileCount > 0 && ` · ${t("partnerPage.fragileCount", { count: brief.fragileCount })}`}
        </p>
        <p>
          <span className="text-muted-foreground">{t("partnerPage.briefVehicles")}:</span>{" "}
          {brief.drivingVehicleCount > 0
            ? t("partnerPage.drivingVehicles", { count: brief.drivingVehicleCount })
            : t("partnerPage.noDrivingVehicles")}
        </p>
        <p>
          <span className="text-muted-foreground">{t("partnerQuote.budgetEst")}:</span>{" "}
          {formatCurrency(brief.budgetEstimate, locale)}
        </p>
        {brief.fuelEstimate != null && brief.fuelEstimate > 0 && (
          <p>
            <span className="text-muted-foreground">{t("partnerPage.briefFuel")}:</span>{" "}
            {formatCurrency(brief.fuelEstimate, locale)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
