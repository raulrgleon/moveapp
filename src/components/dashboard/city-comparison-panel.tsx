"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Home,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { CityAutocomplete } from "@/components/address/city-autocomplete";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import type { CityComparisonResponse } from "@/lib/city-comparison/types";
import type { QoLComparisonMetric } from "@/lib/cost-of-living/qol-metrics";
import type { ComparisonDirection, HousingTrend } from "@/lib/rentcast/types";
import type { Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableScroll } from "@/components/dashboard/table-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function extractZip(text: string): string | undefined {
  const match = text.match(/\b(\d{5})\b/);
  return match?.[0];
}

function TrendBadge({
  trend,
  direction,
  rightLabel,
}: {
  trend: HousingTrend;
  direction: ComparisonDirection;
  rightLabel: string;
}) {
  const t = useT();
  const city = rightLabel.split(",")[0];

  if (direction === "neutral") {
    return <Badge variant="secondary">{t("cityComparison.similar")}</Badge>;
  }

  const label =
    direction === "lower"
      ? t("cityComparison.lowerInDest", { city })
      : t("cityComparison.higherInDest", { city });
  const Icon = direction === "lower" ? TrendingDown : TrendingUp;

  if (trend === "better") {
    return (
      <Badge variant="success" className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  }
  if (trend === "worse") {
    return (
      <Badge variant="warning" className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function formatQoLDisplayValue(
  metric: QoLComparisonMetric,
  side: "origin" | "destination",
  locale: Locale,
  t: ReturnType<typeof useT>
): string {
  const num = side === "origin" ? metric.originNum : metric.destNum;
  const raw = side === "origin" ? metric.originValue : metric.destinationValue;

  switch (metric.key) {
    case "colIndex": {
      const key =
        raw === "belowAvg"
          ? "cityComparison.qol.colIndexBelowAvg"
          : raw === "aboveAvg"
            ? "cityComparison.qol.colIndexAboveAvg"
            : "cityComparison.qol.colIndexNearAvg";
      return t(key);
    }
    case "avgSalary":
      return formatCurrency(num, locale);
    case "unemployment":
    case "incomeTax":
    case "salesTax":
      return `${num}%`;
    case "schoolRating":
      return t("cityComparison.qol.schoolRatingValue", { score: num });
    case "climate":
      return t("cityComparison.qol.climateValue", { temp: num });
    case "walkScore":
      return t("cityComparison.qol.walkScoreValue", { score: num });
    default:
      return raw;
  }
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

export function CityComparisonPanel() {
  const t = useT();
  const { locale } = useLocale();
  const { profile, destinationAddress, destinationPostcode } = useMove();

  const [leftCity, setLeftCity] = useState(profile.origin);
  const [rightCity, setRightCity] = useState(profile.destination);
  const [leftZip, setLeftZip] = useState<string | undefined>();
  const [rightZip, setRightZip] = useState<string | undefined>();
  const [data, setData] = useState<CityComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("housing");

  useEffect(() => {
    setLeftCity(profile.origin);
    setRightCity(profile.destination);
  }, [profile.origin, profile.destination]);

  const loadComparison = useCallback(async () => {
    if (!leftCity.trim() || !rightCity.trim()) return;

    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        origin: leftCity.trim(),
        destination: rightCity.trim(),
      });

      const resolvedLeftZip =
        leftZip ??
        extractZip(leftCity) ??
        (leftCity === profile.origin ? extractZip(profile.origin) : undefined);
      const resolvedRightZip =
        rightZip ??
        extractZip(rightCity) ??
        (rightCity === profile.destination
          ? destinationPostcode?.match(/\d{5}/)?.[0] ??
            extractZip(destinationAddress) ??
            extractZip(profile.destination)
          : undefined);

      if (resolvedLeftZip) params.set("originZip", resolvedLeftZip);
      if (resolvedRightZip) params.set("destZip", resolvedRightZip);

      const res = await fetch(`/api/city-comparison?${params.toString()}`);
      if (!res.ok) throw new Error("comparison failed");
      const json = (await res.json()) as CityComparisonResponse;
      setData(json);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    leftCity,
    rightCity,
    leftZip,
    rightZip,
    profile.origin,
    profile.destination,
    destinationAddress,
    destinationPostcode,
  ]);

  useEffect(() => {
    void loadComparison();
  }, [loadComparison]);

  const useMoveCities = () => {
    setLeftCity(profile.origin);
    setRightCity(profile.destination);
    setLeftZip(undefined);
    setRightZip(undefined);
  };

  const swapCities = () => {
    setLeftCity(rightCity);
    setRightCity(leftCity);
    setLeftZip(rightZip);
    setRightZip(leftZip);
  };

  const hasHousing =
    data?.origin && data?.destination && (data.metrics.length > 0 || data.source === "fallback");
  const essentials = data?.essentials;
  const hasEssentials =
    essentials?.origin && essentials?.destination && essentials.metrics.length > 0;
  const qol = data?.qualityOfLife;
  const hasQoL = qol?.origin && qol?.destination && qol.metrics.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("cityComparison.pickCities")}</CardTitle>
          <CardDescription>{t("cityComparison.pickCitiesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
            <CityAutocomplete
              id="compare-left"
              label={t("cityComparison.cityA")}
              value={leftCity}
              onChange={setLeftCity}
              onSelect={(city) => {
                setLeftCity(city.label);
                setLeftZip(undefined);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden lg:flex shrink-0 mb-0.5"
              onClick={swapCities}
              aria-label={t("cityComparison.swapCities")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <CityAutocomplete
              id="compare-right"
              label={t("cityComparison.cityB")}
              value={rightCity}
              onChange={setRightCity}
              onSelect={(city) => {
                setRightCity(city.label);
                setRightZip(undefined);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={useMoveCities}>
              {t("cityComparison.useMoveRoute")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadComparison()}>
              {t("cityComparison.compareNow")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={swapCities}
            >
              {t("cityComparison.swapCities")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{t("cityComparison.loading")}</span>
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <p className="font-medium text-sm">{t("cityComparison.unavailable")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("cityComparison.unavailableHint")}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                <div className="text-center">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="mt-2 font-semibold text-lg">{leftCity}</p>
                  <p className="text-sm text-muted-foreground">{t("cityComparison.cityA")}</p>
                  {data.origin?.zipCode && (
                    <p className="text-xs text-muted-foreground mt-1">ZIP {data.origin.zipCode}</p>
                  )}
                </div>
                <ArrowRight className="h-6 w-6 text-primary hidden sm:block" />
                <div className="text-center">
                  <Home className="h-8 w-8 text-primary mx-auto" />
                  <p className="mt-2 font-semibold text-lg">{rightCity}</p>
                  <p className="text-sm text-muted-foreground">{t("cityComparison.cityB")}</p>
                  {data.destination?.zipCode && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ZIP {data.destination.zipCode}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {data.verdict && (
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-5 flex gap-4 items-start">
                <Sparkles className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t("cityComparison.verdictTitle", { city: rightCity.split(",")[0] })}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.verdict.overall === "better"
                      ? t("cityComparison.verdictBetter", { city: rightCity.split(",")[0] })
                      : data.verdict.overall === "worse"
                        ? t("cityComparison.verdictWorse", { city: rightCity.split(",")[0] })
                        : t("cityComparison.verdictMixed", { city: rightCity.split(",")[0] })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sm:w-auto flex-wrap h-auto">
              <TabsTrigger value="housing" className="gap-2">
                <Building2 className="h-4 w-4" />
                {t("cityComparison.tabHousing")}
              </TabsTrigger>
              <TabsTrigger value="essentials" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t("cityComparison.tabEssentials")}
              </TabsTrigger>
              <TabsTrigger value="qol" className="gap-2">
                <Sun className="h-4 w-4" />
                {t("cityComparison.tabQualityOfLife")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="housing" className="mt-4 space-y-4">
              {!hasHousing ? (
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    {data.rentcastMissing
                      ? t("cityComparison.rentcastMissing")
                      : t("cityComparison.housingUnavailable")}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {data.source === "fallback" && (
                    <p className="text-xs text-muted-foreground">{t("cityComparison.fallbackNote")}</p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {data.metrics.slice(0, 4).map((metric) => (
                      <Card key={metric.key} className="overflow-hidden">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">{t(metric.labelKey)}</p>
                          <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
                            <span className="text-sm truncate min-w-0">{metric.originValue}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-sm font-semibold truncate min-w-0 text-right">
                              {metric.destinationValue}
                            </span>
                          </div>
                          <MetricCompareBar trend={metric.trend} />
                          <div className="mt-2">
                            <TrendBadge trend={metric.trend} direction={metric.direction} rightLabel={rightCity} />
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
                              <TableHead>{leftCity}</TableHead>
                              <TableHead>{rightCity}</TableHead>
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
                                  <TrendBadge trend={metric.trend} direction={metric.direction} rightLabel={rightCity} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableScroll>
                      <p className="mt-4 text-[10px] text-muted-foreground">
                        {t("cityComparison.attribution")}
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="essentials" className="mt-4 space-y-4">
              {!hasEssentials ? (
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    {t("cityComparison.essentialsUnavailable")}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{t("cityComparison.essentialsNote")}</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">
                          {t("cityComparison.essentials.weeklyBasket")}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground truncate">{leftCity}</p>
                            <p className="text-xl font-bold">
                              {formatCurrency(essentials!.origin!.weeklyBasketTotal, locale)}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground truncate">{rightCity}</p>
                            <p className="text-xl font-bold">
                              {formatCurrency(essentials!.destination!.weeklyBasketTotal, locale)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">
                          {t("cityComparison.essentials.monthlyGroceries")}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-lg font-semibold">
                            {formatCurrency(essentials!.origin!.monthlyGroceriesEstimate, locale)}
                          </p>
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          <p className="text-lg font-semibold">
                            {formatCurrency(
                              essentials!.destination!.monthlyGroceriesEstimate,
                              locale
                            )}
                          </p>
                        </div>
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          {t("cityComparison.essentials.monthlyHint")}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {essentials!.metrics
                      .filter((m) => !["weekly_basket", "monthly_groceries"].includes(m.key))
                      .slice(0, 6)
                      .map((metric) => (
                        <Card key={metric.key} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">{t(metric.labelKey)}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {t(metric.unitKey)}
                                </p>
                              </div>
                              {metric.key !== "gas_gallon" && (
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  Walmart
                                </Badge>
                              )}
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span className="text-sm">{metric.originValue}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-semibold">{metric.destinationValue}</span>
                            </div>
                            <div className="mt-2">
                              <TrendBadge trend={metric.trend} direction={metric.direction} rightLabel={rightCity} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {t("cityComparison.essentialsTableTitle")}
                      </CardTitle>
                      <CardDescription>{t("cityComparison.essentialsTableDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TableScroll>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("cityComparison.metric")}</TableHead>
                              <TableHead>{leftCity}</TableHead>
                              <TableHead>{rightCity}</TableHead>
                              <TableHead>{t("cityComparison.trend")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {essentials!.metrics.map((metric) => (
                              <TableRow key={metric.key}>
                                <TableCell>
                                  <div className="font-medium">{t(metric.labelKey)}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {t(metric.unitKey)}
                                    {metric.key !== "gas_gallon" &&
                                      metric.key !== "weekly_basket" &&
                                      metric.key !== "monthly_groceries" &&
                                      " · Walmart"}
                                  </div>
                                </TableCell>
                                <TableCell>{metric.originValue}</TableCell>
                                <TableCell>{metric.destinationValue}</TableCell>
                                <TableCell>
                                  <TrendBadge trend={metric.trend} direction={metric.direction} rightLabel={rightCity} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableScroll>
                      <p className="mt-4 text-[10px] text-muted-foreground">
                        {t("cityComparison.essentialsAttribution")}
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="qol" className="mt-4 space-y-4">
              {!hasQoL ? (
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    {t("cityComparison.unavailableHint")}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{t("cityComparison.qolNote")}</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {qol!.metrics.map((metric) => (
                      <Card key={metric.key} className="overflow-hidden">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">{t(metric.labelKey)}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-sm">{formatQoLDisplayValue(metric, "origin", locale, t)}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-sm font-semibold">
                              {formatQoLDisplayValue(metric, "destination", locale, t)}
                            </span>
                          </div>
                          <MetricCompareBar trend={metric.trend} />
                          <div className="mt-2">
                            <TrendBadge trend={metric.trend} direction={metric.direction} rightLabel={rightCity} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t("cityComparison.qolAttribution")}</p>
                </>
              )}
            </TabsContent>
          </Tabs>

          {hasHousing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {t("cityComparison.originSummary", { city: leftCity })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1 text-muted-foreground">
                  <p>
                    {t("cityComparison.avgRent")}:{" "}
                    {data.origin!.averageRent != null
                      ? `${formatCurrency(data.origin!.averageRent, locale)}/mo`
                      : "—"}
                  </p>
                  <p>
                    {t("cityComparison.medianHome")}:{" "}
                    {data.origin!.medianHomePrice != null
                      ? formatCurrency(data.origin!.medianHomePrice, locale)
                      : "—"}
                  </p>
                  {hasEssentials && (
                    <p>
                      {t("cityComparison.essentials.weeklyBasket")}:{" "}
                      {formatCurrency(essentials!.origin!.weeklyBasketTotal, locale)}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {t("cityComparison.destSummary", { city: rightCity })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1 text-muted-foreground">
                  <p>
                    {t("cityComparison.avgRent")}:{" "}
                    {data.destination!.averageRent != null
                      ? `${formatCurrency(data.destination!.averageRent, locale)}/mo`
                      : "—"}
                  </p>
                  <p>
                    {t("cityComparison.medianHome")}:{" "}
                    {data.destination!.medianHomePrice != null
                      ? formatCurrency(data.destination!.medianHomePrice, locale)
                      : "—"}
                  </p>
                  {hasEssentials && (
                    <p>
                      {t("cityComparison.essentials.weeklyBasket")}:{" "}
                      {formatCurrency(essentials!.destination!.weeklyBasketTotal, locale)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
