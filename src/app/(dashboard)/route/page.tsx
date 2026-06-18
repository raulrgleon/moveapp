"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { RouteBudgetDelta } from "@/hooks/use-route-stats";
import { formatCurrency } from "@/lib/utils";
import {
  ExternalLink,
  Fuel,
  Hotel,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  PawPrint,
  RefreshCw,
  Route as RouteIcon,
} from "lucide-react";
import { RouteWeatherPanel } from "@/components/dashboard/route-weather-panel";
import { PilotSuggestionCard } from "@/components/pilot/pilot-suggestion-card";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { EstimateDisclaimer } from "@/components/marketing/estimate-disclaimer";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouteStats } from "@/hooks/use-route-stats";

function RouteMapLoader() {
  const t = useT();
  return (
    <div className="min-h-[min(52dvh,28rem)] sm:min-h-[360px] rounded-xl border bg-muted/30 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">{t("routePage.loadingMap")}</p>
    </div>
  );
}

const RouteMap = dynamic(
  () => import("@/components/dashboard/route-map-wrapper").then((m) => m.RouteMapWrapper),
  {
    ssr: false,
    loading: () => <RouteMapLoader />,
  }
);

function buildStopMapsUrl(stop: { name: string; location: string; lat?: number; lon?: number }): string {
  if (stop.lat != null && stop.lon != null) {
    return `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lon}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.name}, ${stop.location}`)}`;
}

function stopTypeLabel(t: (key: string) => string, type: keyof typeof stopIcons): string {
  return t(`routePage.stopType.${type}`);
}

const stopIcons = {
  gas: Fuel,
  hotel: Hotel,
  rest: MapPin,
  pet_hotel: PawPrint,
};

function buildGoogleMapsUrl(
  originLat?: number,
  originLon?: number,
  destLat?: number,
  destLon?: number
): string | null {
  if (originLat == null || originLon == null || destLat == null || destLon == null) return null;
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}`;
}

function buildAppleMapsUrl(
  originLat?: number,
  originLon?: number,
  destLat?: number,
  destLon?: number
): string | null {
  if (originLat == null || originLon == null || destLat == null || destLon == null) return null;
  return `https://maps.apple.com/?saddr=${originLat},${originLon}&daddr=${destLat},${destLon}`;
}

export default function RoutePage() {
  const t = useT();
  const { profile } = useMove();
  const { stats, loading, stopsLoading, error, routeIndex, setRouteIndex } = useRouteStats();
  const [cinematic, setCinematic] = useState(false);
  const [budgetUpdating, setBudgetUpdating] = useState(false);
  const [budgetSyncNote, setBudgetSyncNote] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<RouteBudgetDelta | null>).detail;
      if (detail && detail.delta !== 0) {
        const amount = formatCurrency(Math.abs(detail.delta));
        setBudgetSyncNote(
          detail.delta > 0
            ? t("routePage.budgetDeltaUp", { amount })
            : t("routePage.budgetDeltaDown", { amount })
        );
      } else {
        setBudgetSyncNote(t("routePage.budgetAutoSynced"));
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setBudgetSyncNote(null), 8000);
    };

    window.addEventListener("movepilot:budget-route-sync", onSync);
    return () => {
      window.removeEventListener("movepilot:budget-route-sync", onSync);
      if (timer) clearTimeout(timer);
    };
  }, [t]);

  const updateBudgetForRoute = async () => {
    setBudgetUpdating(true);
    try {
      await apiFetch("/api/budget", {
        method: "PATCH",
        body: JSON.stringify({ recalculate: true, routeIndex }),
      });
    } finally {
      setBudgetUpdating(false);
    }
  };

  const distanceLabel = stats
    ? `${stats.distanceMiles.toLocaleString()} ${t("routePage.miles")}`
    : loading
      ? "…"
      : "—";
  const driveTimeLabel = stats?.driveTimeLabel ?? (loading ? "…" : "—");
  const stopCount = stats?.stops.length ?? stats?.stopCount ?? 0;
  const driveDays =
    stats && stats.durationHours > 10
      ? t("routePage.multiDayRoute")
      : t("routePage.twoDayRoute");

  const googleUrl = buildGoogleMapsUrl(
    profile.originLat,
    profile.originLon,
    profile.destinationLat,
    profile.destinationLon
  );
  const appleUrl = buildAppleMapsUrl(
    profile.originLat,
    profile.originLon,
    profile.destinationLat,
    profile.destinationLon
  );

  return (
    <>
      <DashboardHeader title={t("routePage.title")} description={t("routePage.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("routePage.pageTitle")}
          description={t("routePage.pageDesc", {
            origin: profile.origin,
            destination: profile.destination,
          })}
          action={
            googleUrl || appleUrl ? (
              <div className="flex flex-wrap gap-2">
                {googleUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t("routePage.openGoogleMaps")}
                    </a>
                  </Button>
                )}
                {appleUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={appleUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t("routePage.openAppleMaps")}
                    </a>
                  </Button>
                )}
              </div>
            ) : undefined
          }
        />

        <EstimateDisclaimer />

        {budgetSyncNote && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-sm">{budgetSyncNote}</CardContent>
          </Card>
        )}

        {error === "fetch_failed" && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm">{t("routePage.routeLoadError")}</CardContent>
          </Card>
        )}

        {(!profile.originLat || !profile.destinationLat) && (
          <PilotSuggestionCard
            message={t("routePage.pilotSetCoords")}
            actionLabelKey="routePage.mapEmptyAction"
            href="/settings"
          />
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t("routePage.totalDistance")}
            value={distanceLabel}
            icon={RouteIcon}
          />
          <StatCard
            label={t("routePage.estDriveTime")}
            value={driveTimeLabel}
            subtext={driveDays}
            icon={RouteIcon}
          />
          <StatCard
            label={t("routePage.recommendedStops")}
            value={`${stopCount}`}
            subtext={t("routePage.stopsSubtext")}
            icon={MapPin}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div
            className={
              cinematic
                ? "fixed inset-0 z-50 bg-background p-3 sm:p-4 flex flex-col safe-top safe-bottom"
                : "relative"
            }
          >
            {cinematic && (
              <div className="flex justify-between items-center mb-3 shrink-0 gap-2">
                <p className="font-semibold text-sm sm:text-base">{t("routePage.cinematicMode")}</p>
                <Button variant="outline" size="sm" onClick={() => setCinematic(false)}>
                  <Minimize2 className="mr-2 h-4 w-4" />
                  {t("routePage.exitCinematic")}
                </Button>
              </div>
            )}
            <RouteMap
              className={cinematic ? "flex-1 min-h-0 rounded-xl" : undefined}
              expanded={cinematic}
              showNewHome
              alternatives={stats?.alternatives}
              selectedRouteIndex={routeIndex}
              onSelectRoute={setRouteIndex}
              stops={stats?.stops}
            />
            {!cinematic && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-3 right-3 z-[500] shadow-lg h-9 sm:h-10"
                onClick={() => setCinematic(true)}
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t("routePage.cinematicMode")}</span>
                <span className="sm:hidden sr-only">{t("routePage.cinematicMode")}</span>
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <RouteWeatherPanel />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("routePage.pageTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start">
                  <span className="text-muted-foreground shrink-0">{t("routePage.origin")}</span>
                  <span className="font-medium sm:text-right break-words min-w-0">{profile.origin}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start">
                  <span className="text-muted-foreground shrink-0">{t("routePage.destination")}</span>
                  <span className="font-medium sm:text-right break-words min-w-0">{profile.destination}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {stats && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("routePage.alternativeRoutes")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground hidden lg:block">
                {t("routePage.alternativeRoutesDesc")}
              </p>
              <div className="hidden lg:grid gap-2 sm:grid-cols-3">
                {stats.alternatives.slice(0, 3).map((alt) => (
                  <button
                    key={alt.index}
                    type="button"
                    onClick={() => setRouteIndex(alt.index)}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      alt.index === routeIndex
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium">{t("routePage.routeOption", { n: alt.index + 1 })}</p>
                    <p className="text-muted-foreground mt-1">
                      {alt.distanceMiles.toLocaleString()} {t("routePage.miles")} · {alt.driveTimeLabel}
                    </p>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={budgetUpdating}
                onClick={() => void updateBudgetForRoute()}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${budgetUpdating ? "animate-spin" : ""}`} />
                {t("routePage.updateBudgetForRoute")}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("routePage.recommendedStops")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !stats ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.loading")}
              </div>
            ) : stats?.stops.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.stops.map((stop) => {
                  const Icon = stopIcons[stop.type];
                  const mapsUrl = buildStopMapsUrl(stop);
                  return (
                    <div key={stop.id} className="flex gap-3 rounded-lg border p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-2">
                          <p className="font-medium text-sm leading-snug">{stop.name}</p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {stopTypeLabel(t, stop.type)}
                          </Badge>
                        </div>
                        {stop.location && (
                          <p className="text-sm text-foreground/80 mt-1.5 leading-snug break-words">
                            {stop.location}
                          </p>
                        )}
                        {stop.estimatedPrice != null && stop.estimatedPrice > 0 && (
                          <p className="text-sm font-medium text-foreground mt-1">
                            ~${stop.estimatedPrice}/night
                          </p>
                        )}
                        {stop.gasPricePerGallon != null && stop.gasPricePerGallon > 0 && (
                          <p className="text-sm font-medium text-foreground mt-1">
                            ${stop.gasPricePerGallon.toFixed(2)}/gal · {t("routePage.liveGasPrice")}
                          </p>
                        )}
                        {stop.vehicleFills && stop.vehicleFills.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-foreground">
                              {t("routePage.fuelPerVehicle")}
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {stop.vehicleFills.map((fill) => (
                                <li key={fill.vehicleLabel}>
                                  {fill.isElectric && fill.kwhToCharge != null
                                    ? `${fill.vehicleLabel}: ${t("routePage.kwhAtStop", { kwh: fill.kwhToCharge })}`
                                    : `${fill.vehicleLabel}: ${fill.gallonsToFill.toFixed(1)} gal · ${fill.tankGallons.toFixed(0)} gal tank · ${fill.mpg} MPG`}
                                </li>
                              ))}
                            </ul>
                            {stop.totalGallonsAtStop != null && stop.totalGallonsAtStop > 0 && (
                              <p className="text-xs font-medium text-foreground">
                                {t("routePage.totalFuelAtStop", {
                                  gallons: stop.totalGallonsAtStop.toFixed(1),
                                })}
                              </p>
                            )}
                          </div>
                        )}
                        {stop.notes && !stop.vehicleFills?.length && (
                          <p className="text-xs text-muted-foreground mt-1">{stop.notes}</p>
                        )}
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t("routePage.openStopInMaps")}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("weather.configureRouteHint")}</p>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
