"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Sparkles, Truck } from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import { useRouteStats } from "@/hooks/use-route-stats";
import { buildTruckDeepLink } from "@/lib/trucks/deep-links";
import {
  buildTrailerRecommendation,
  estimateTruckOptions,
} from "@/lib/trucks/recommendations";
import { truckOptionLabel } from "@/lib/trucks/truck-choice";
import { anyVehicleCanTow } from "@/lib/vehicles/tow-capacity";
import type { TruckOption } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export default function TrucksPage() {
  const t = useT();
  const { locale } = useLocale();
  const { profile, vehicles, truckChoice, setTruckChoice } = useMove();
  const { stats, loading } = useRouteStats();
  const hasRoute = stats != null && stats.distanceMiles > 0;
  const miles = hasRoute ? stats.distanceMiles : null;
  const canTow = anyVehicleCanTow(vehicles);
  const options = estimateTruckOptions(
    profile,
    miles ?? profile.budget / 5,
    locale,
    vehicles
  );
  const trucks = options.filter((o) => o.type === "truck");
  const trailers = options.filter((o) => o.type === "trailer");
  const recommendation = buildTrailerRecommendation(profile, miles ?? 0, vehicles, locale);

  const pickRecommended = (list: TruckOption[]) =>
    list.length
      ? list.reduce((best, o) => (o.estimatedPrice < best.estimatedPrice ? o : best)).id
      : null;

  const trailerRecommendedId = useMemo(() => pickRecommended(trailers), [trailers]);
  const truckRecommendedId = useMemo(() => pickRecommended(trucks), [trucks]);
  const allRecommendedId = useMemo(() => pickRecommended(options), [options]);

  return (
    <>
      <DashboardHeader title={t("trucksPage.title")} description={t("trucksPage.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("trucksPage.pageTitle")}
          description={
            t("trucksPage.pageDesc", {
              origin: profile.origin,
              destination: profile.destination,
            }) +
            (stats
              ? t("trucksPage.pageDescMiles", { miles: stats.distanceMiles.toLocaleString() })
              : "")
          }
        />

        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{t("trucksPage.householdGoodsBanner")}</p>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/vehicles">{t("trucksPage.vehiclesLink")}</Link>
            </Button>
          </CardContent>
        </Card>

        {vehicles.length > 0 && !canTow && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-100">
              {t("trucksPage.noTowBanner")}
            </CardContent>
          </Card>
        )}

        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-4 text-sm text-muted-foreground">
            {hasRoute
              ? t("trucksPage.estimateBannerMiles", { miles: stats!.distanceMiles.toLocaleString() })
              : t("trucksPage.estimateBannerNoRoute")}
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-medium">{t("trucksPage.aiRecommendation")}</p>
              {loading && !stats ? (
                <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("trucksPage.calculatingPricing")}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{recommendation}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={canTow ? "trailers" : "trucks"}>
          <TabsList className="flex h-auto w-full flex-wrap gap-1">
            <TabsTrigger value="trailers" disabled={trailers.length === 0}>
              {t("trucksPage.trailers")}
            </TabsTrigger>
            <TabsTrigger value="trucks">{t("trucksPage.trucks")}</TabsTrigger>
            <TabsTrigger value="all">{t("trucksPage.allOptions")}</TabsTrigger>
          </TabsList>

          {trailers.length === 0 && vehicles.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">{t("trucksPage.trailerHiddenNote")}</p>
          )}

          <TabsContent value="trailers" className="mt-6">
            <OptionGrid
              options={trailers}
              recommendedId={trailerRecommendedId}
              moveDate={profile.moveDate}
              origin={profile.origin}
              destination={profile.destination}
              truckChoice={truckChoice}
              onSave={setTruckChoice}
            />
          </TabsContent>
          <TabsContent value="trucks" className="mt-6">
            <OptionGrid
              options={trucks}
              recommendedId={truckRecommendedId}
              moveDate={profile.moveDate}
              origin={profile.origin}
              destination={profile.destination}
              truckChoice={truckChoice}
              onSave={setTruckChoice}
            />
          </TabsContent>
          <TabsContent value="all" className="mt-6">
            <OptionGrid
              options={options}
              recommendedId={allRecommendedId}
              moveDate={profile.moveDate}
              origin={profile.origin}
              destination={profile.destination}
              truckChoice={truckChoice}
              onSave={setTruckChoice}
            />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}

function OptionGrid({
  options,
  recommendedId,
  moveDate,
  origin,
  destination,
  truckChoice,
  onSave,
}: {
  options: TruckOption[];
  recommendedId?: string | null;
  moveDate: string;
  origin: string;
  destination: string;
  truckChoice: string | null;
  onSave: (choice: string | null) => void;
}) {
  const t = useT();
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSave = async (option: TruckOption) => {
    const label = truckOptionLabel(option);
    setSavingId(option.id);
    onSave(label);
    setSavingId(null);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {options.map((option) => {
        const label = truckOptionLabel(option);
        const isSaved = truckChoice === label;
        const deepLink = buildTruckDeepLink(option.company, origin, destination, moveDate);

        const isRecommended = recommendedId === option.id;

        return (
          <Card
            key={option.id}
            className={cn(
              "flex flex-col transition-all duration-300 hover:scale-[1.01] hover:shadow-lg",
              isRecommended &&
                "ring-2 ring-primary/50 shadow-lg shadow-primary/15 bg-gradient-to-br from-primary/8 via-card to-card"
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isRecommended ? "bg-primary/15" : "bg-muted"
                    )}
                  >
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{option.company}</CardTitle>
                    <p className="text-sm text-muted-foreground">{option.vehicleSize}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isRecommended && (
                    <Badge className="gap-1 bg-primary text-primary-foreground shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      {t("trucksPage.bestForYou")}
                    </Badge>
                  )}
                  <Badge variant={option.type === "trailer" ? "default" : "secondary"}>
                    {option.type === "trailer" ? t("trucksPage.typeTrailer") : t("trucksPage.typeTruck")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatCurrency(option.estimatedPrice)}</span>
                <span className="text-sm text-muted-foreground">{t("trucksPage.estimated")}</span>
              </div>
              <p className="text-sm text-muted-foreground">{option.mileagePolicy}</p>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t("trucksPage.pros")}</p>
                <ul className="text-sm space-y-1">
                  {option.pros.map((p) => (
                    <li key={p} className="text-emerald-700">+ {p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t("trucksPage.cons")}</p>
                <ul className="text-sm space-y-1">
                  {option.cons.map((c) => (
                    <li key={c} className="text-muted-foreground">− {c}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm">
                <span className="font-medium">{t("trucksPage.bestFor")}</span> {option.bestFor}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button className="w-full" asChild>
                <a href={deepLink} target="_blank" rel="noopener noreferrer">
                  {t("trucksPage.viewOption")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                variant={isSaved ? "secondary" : "outline"}
                className="w-full"
                disabled={savingId === option.id}
                onClick={() => handleSave(option)}
              >
                {savingId === option.id
                  ? t("trucksPage.saving")
                  : isSaved
                    ? t("trucksPage.savedChoice")
                    : t("trucksPage.saveChoice")}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
