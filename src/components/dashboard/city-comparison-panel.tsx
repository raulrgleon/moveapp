"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Building2, Home, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import type { HousingMarketResponse, HousingTrend } from "@/lib/rentcast/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableScroll } from "@/components/dashboard/table-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function TrendBadge({ trend, destinationLabel }: { trend: HousingTrend; destinationLabel: string }) {
  const t = useT();
  if (trend === "better") {
    return (
      <Badge variant="success" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        {t("cityComparison.betterInDest", { city: destinationLabel.split(",")[0] })}
      </Badge>
    );
  }
  if (trend === "worse") {
    return (
      <Badge variant="warning" className="gap-1">
        <TrendingUp className="h-3 w-3" />
        {t("cityComparison.higherInDest", { city: destinationLabel.split(",")[0] })}
      </Badge>
    );
  }
  return <Badge variant="secondary">{t("cityComparison.similar")}</Badge>;
}

function MetricCompareBar({ trend }: { trend: HousingTrend }) {
  const destPct = trend === "better" ? 72 : trend === "worse" ? 28 : 50;
  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-muted-foreground/30 via-primary to-primary transition-all duration-700 ease-out"
        style={{ width: `${destPct}%` }}
      />
    </div>
  );
}

function extractZip(text: string): string | undefined {
  const match = text.match(/\b(\d{5})\b/);
  return match?.[1];
}

export function CityComparisonPanel() {
  const t = useT();
  const { locale } = useLocale();
  const { profile, destinationAddress, destinationPostcode } = useMove();
  const [data, setData] = useState<HousingMarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          origin: profile.origin,
          destination: profile.destination,
        });
        const destZip =
          destinationPostcode?.match(/\d{5}/)?.[0] ??
          extractZip(destinationAddress) ??
          extractZip(profile.destination);
        const originZip = extractZip(profile.origin);
        if (destZip) params.set("destZip", destZip);
        if (originZip) params.set("originZip", originZip);

        const res = await fetch(`/api/housing-market?${params.toString()}`);
        if (!res.ok) throw new Error("housing failed");
        const json = (await res.json()) as HousingMarketResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile.origin, profile.destination, destinationAddress, destinationPostcode]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("cityComparison.loading")}</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.origin || !data?.destination || data.metrics.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <p className="font-medium text-sm">{t("cityComparison.unavailable")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.rentcastMissing
              ? t("cityComparison.rentcastMissing")
              : t("cityComparison.unavailableHint")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const highlightMetrics = data.metrics.slice(0, 4);

  return (
    <div className="space-y-4">
      {data.source === "fallback" && (
        <p className="text-xs text-muted-foreground">{t("cityComparison.fallbackNote")}</p>
      )}
      {data.rentcastMissing && data.source !== "fallback" && (
        <p className="text-xs text-muted-foreground">{t("cityComparison.rentcastMissing")}</p>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div className="text-center">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="mt-2 font-semibold text-lg">{profile.origin}</p>
              <p className="text-sm text-muted-foreground">{t("cityComparison.currentCity")}</p>
              <p className="text-xs text-muted-foreground mt-1">ZIP {data.origin.zipCode}</p>
            </div>
            <ArrowRight className="h-6 w-6 text-primary hidden sm:block" />
            <div className="text-center">
              <Home className="h-8 w-8 text-primary mx-auto" />
              <p className="mt-2 font-semibold text-lg">{profile.destination}</p>
              <p className="text-sm text-muted-foreground">{t("cityComparison.destination")}</p>
              <p className="text-xs text-muted-foreground mt-1">ZIP {data.destination.zipCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlightMetrics.map((metric) => (
          <Card key={metric.key} className="overflow-hidden">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t(metric.labelKey)}</p>
              <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm truncate min-w-0">{metric.originValue}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold truncate min-w-0 text-right">{metric.destinationValue}</span>
              </div>
              <MetricCompareBar trend={metric.trend} />
              <div className="mt-2">
                <TrendBadge trend={metric.trend} destinationLabel={profile.destination} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("cityComparison.sideBySide")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cityComparison.metric")}</TableHead>
                  <TableHead>{profile.origin}</TableHead>
                  <TableHead>{profile.destination}</TableHead>
                  <TableHead>{t("cityComparison.trend")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.metrics.map((metric) => (
                  <TableRow key={metric.key}>
                    <TableCell className="font-medium">{t(metric.labelKey)}</TableCell>
                    <TableCell>{metric.originValue}</TableCell>
                    <TableCell>{metric.destinationValue}</TableCell>
                    <TableCell>
                      <TrendBadge trend={metric.trend} destinationLabel={profile.destination} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroll>
          <p className="mt-4 text-[10px] text-muted-foreground">{t("cityComparison.attribution")}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("cityComparison.originSummary", { city: profile.origin })}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            <p>
              {t("cityComparison.avgRent")}:{" "}
              {data.origin.averageRent != null
                ? `${formatCurrency(data.origin.averageRent, locale)}/mo`
                : "—"}
            </p>
            <p>
              {t("cityComparison.medianHome")}:{" "}
              {data.origin.medianHomePrice != null
                ? formatCurrency(data.origin.medianHomePrice, locale)
                : "—"}
            </p>
            <p>
              {t("cityComparison.rent2Bed")}:{" "}
              {data.origin.rent2Bed != null
                ? `${formatCurrency(data.origin.rent2Bed, locale)}/mo`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("cityComparison.destSummary", { city: profile.destination })}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            <p>
              {t("cityComparison.avgRent")}:{" "}
              {data.destination.averageRent != null
                ? `${formatCurrency(data.destination.averageRent, locale)}/mo`
                : "—"}
            </p>
            <p>
              {t("cityComparison.medianHome")}:{" "}
              {data.destination.medianHomePrice != null
                ? formatCurrency(data.destination.medianHomePrice, locale)
                : "—"}
            </p>
            <p>
              {t("cityComparison.rent2Bed")}:{" "}
              {data.destination.rent2Bed != null
                ? `${formatCurrency(data.destination.rent2Bed, locale)}/mo`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
