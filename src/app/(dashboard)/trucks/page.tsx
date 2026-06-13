"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Sparkles, Truck } from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { useRouteStats } from "@/hooks/use-route-stats";
import { buildTruckDeepLink } from "@/lib/trucks/deep-links";
import {
  buildTrailerRecommendation,
  estimateTruckOptions,
} from "@/lib/trucks/recommendations";
import type { TruckOption } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function TrucksPage() {
  const t = useT();
  const { profile, vehicles, truckChoice, setTruckChoice } = useMove();
  const { stats, loading } = useRouteStats();
  const hasRoute = stats != null && stats.distanceMiles > 0;
  const miles = hasRoute ? stats.distanceMiles : null;
  const options = estimateTruckOptions(profile, miles ?? profile.budget / 5);
  const trucks = options.filter((o) => o.type === "truck");
  const trailers = options.filter((o) => o.type === "trailer");
  const recommendation = buildTrailerRecommendation(profile, miles ?? 0, vehicles);

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

        <Tabs defaultValue="trailers">
          <TabsList className="flex h-auto w-full flex-wrap gap-1">
            <TabsTrigger value="trailers">{t("trucksPage.trailers")}</TabsTrigger>
            <TabsTrigger value="trucks">{t("trucksPage.trucks")}</TabsTrigger>
            <TabsTrigger value="all">{t("trucksPage.allOptions")}</TabsTrigger>
          </TabsList>

          <TabsContent value="trailers" className="mt-6">
            <OptionGrid
              options={trailers}
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
  moveDate,
  origin,
  destination,
  truckChoice,
  onSave,
}: {
  options: TruckOption[];
  moveDate: string;
  origin: string;
  destination: string;
  truckChoice: string | null;
  onSave: (choice: string | null) => void;
}) {
  const t = useT();
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSave = async (option: TruckOption) => {
    const label = `${option.company} — ${option.vehicleSize}`;
    setSavingId(option.id);
    onSave(label);
    setSavingId(null);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {options.map((option) => {
        const label = `${option.company} — ${option.vehicleSize}`;
        const isSaved = truckChoice === label;
        const deepLink = buildTruckDeepLink(option.company, origin, destination, moveDate);

        return (
          <Card key={option.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{option.company}</CardTitle>
                    <p className="text-sm text-muted-foreground">{option.vehicleSize}</p>
                  </div>
                </div>
                <Badge variant={option.type === "trailer" ? "default" : "secondary"}>
                  {option.type === "trailer" ? t("trucksPage.typeTrailer") : t("trucksPage.typeTruck")}
                </Badge>
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
