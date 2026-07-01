"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
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

function stopTypeLabel(
  t: (key: string) => string,
  type: keyof typeof stopIcons,
  restStopKind?: "rest_area" | "services" | "gas_station"
): string {
  if (type === "rest" && restStopKind) {
    return t(`routePage.restStopKind.${restStopKind}`);
  }
  return t(`routePage.stopType.${type}`);
}

const stopIcons = {
  gas: Fuel,
  hotel: Hotel,
  rest: MapPin,
  pet_hotel: PawPrint,
} as const;

function buildGoogleMapsUrl(
  originLat?: number,
  originLon?: number,
  destLat?: number,
  destLon?: number,
  waypoints: Array<[number, number]> = []
): string | null {
  if (originLat == null || originLon == null || destLat == null || destLon == null) return null;
  const params = new URLSearchParams({
    api: "1",
    origin: `${originLat},${originLon}`,
    destination: `${destLat},${destLon}`,
    travelmode: "driving",
  });
  if (waypoints.length) {
    params.set(
      "waypoints",
      waypoints.map(([lat, lon]) => `${lat},${lon}`).join("|")
    );
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildAppleMapsUrl(
  originLat?: number,
  originLon?: number,
  destLat?: number,
  destLon?: number,
  waypoints: Array<[number, number]> = []
): string | null {
  if (originLat == null || originLon == null || destLat == null || destLon == null) return null;
  const destinationPath = [
    ...waypoints.map(([lat, lon]) => `${lat},${lon}`),
    `${destLat},${destLon}`,
  ].join(" to:");
  return `https://maps.apple.com/?saddr=${originLat},${originLon}&daddr=${encodeURIComponent(destinationPath)}&dirflg=d`;
}

function sampledRouteWaypoints(
  coordinates: [number, number][] | undefined,
  maxWaypoints = 8
): Array<[number, number]> {
  if (!coordinates || coordinates.length < 3) return [];
  const interior = coordinates.slice(1, -1);
  if (!interior.length) return [];
  const count = Math.min(maxWaypoints, interior.length);
  const step = interior.length / (count + 1);
  const points: Array<[number, number]> = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.max(0, Math.min(interior.length - 1, Math.round((i + 1) * step - 1)));
    const [lon, lat] = interior[idx];
    points.push([lat, lon]);
  }
  return points;
}

export default function RoutePage() {
  const t = useT();
  const { profile } = useMove();
  const { stats, loading, stopsLoading, error, routeIndex, setRouteIndex } = useRouteStats();
  const [cinematic, setCinematic] = useState(false);
  const [interstateOnly, setInterstateOnly] = useState(false);
  const [budgetSyncNote, setBudgetSyncNote] = useState<string | null>(null);

  const filteredAlternatives = useMemo(() => {
    if (!stats?.alternatives?.length) return [];
    if (!interstateOnly) return stats.alternatives;
    return stats.alternatives.filter((alt) => alt.usesInterstate);
  }, [stats?.alternatives, interstateOnly]);

  useEffect(() => {
    if (!interstateOnly || !filteredAlternatives.length) return;
    const selectedVisible = filteredAlternatives.some((alt) => alt.index === routeIndex);
    if (!selectedVisible) {
      setRouteIndex(filteredAlternatives[0].index);
    }
  }, [interstateOnly, filteredAlternatives, routeIndex, setRouteIndex]);

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

  const distanceLabel = stats
    ? `${stats.distanceMiles.toLocaleString()} ${t("routePage.miles")}`
    : loading
      ? "…"
      : "—";
  const driveTimeLabel = stats?.driveTimeLabel ?? (loading ? "…" : "—");
  const stopCount = stats?.stops.length ?? stats?.stopCount ?? 0;
  const travelDaysLabel = stats
    ? stats.travelDays === 1
      ? t("routePage.travelDayOne")
      : t("routePage.travelDays", { days: stats.travelDays })
    : loading
      ? "…"
      : "—";

  const selectedAlternative = useMemo(
    () =>
      stats?.alternatives?.find((alt) => alt.index === routeIndex) ??
      stats?.alternatives?.[routeIndex] ??
      stats?.alternatives?.[0],
    [stats?.alternatives, routeIndex]
  );
  const externalWaypointLimit = selectedAlternative?.usesInterstate ? 14 : 8;
  const externalWaypoints = useMemo(
    () => sampledRouteWaypoints(selectedAlternative?.coordinates, externalWaypointLimit),
    [selectedAlternative?.coordinates, externalWaypointLimit]
  );

  const googleUrl = buildGoogleMapsUrl(
    profile.originLat,
    profile.originLon,
    profile.destinationLat,
    profile.destinationLon,
    externalWaypoints
  );
  const appleUrl = buildAppleMapsUrl(
    profile.originLat,
    profile.originLon,
    profile.destinationLat,
    profile.destinationLon,
    externalWaypoints
  );

  return (
    <>
      <DashboardHeader
        title={t("routePage.title")}
        description={t("routePage.pageDesc", {
          origin: profile.origin,
          destination: profile.destination,
        })}
      />
      <PageContainer withMobileNavPad={!cinematic} className={cinematic ? "space-y-0 !pb-3 sm:!pb-4 lg:!pb-6" : undefined}>
        {cinematic ? (
          <div className="flex h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-xl border-2 border-border/80 bg-card shadow-xl ring-1 ring-primary/10 lg:h-[calc(100dvh-5.5rem)]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-muted/40 px-3 py-2.5 sm:px-4">
              <div className="min-w-0">
                <p className="font-semibold text-sm">{t("routePage.cinematicMode")}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("routePage.cinematicInAppHint")} · {profile.origin} → {profile.destination}
                </p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => setCinematic(false)}>
                <Minimize2 className="mr-2 h-4 w-4" />
                {t("routePage.exitCinematic")}
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <RouteMap
                className="h-full min-h-[320px] w-full"
                expanded
                showNewHome
                alternatives={filteredAlternatives}
                selectedRouteIndex={routeIndex}
                onSelectRoute={setRouteIndex}
                stops={stats?.stops}
              />
            </div>
          </div>
        ) : (
          <>
        <PageHeader
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
            subtext={travelDaysLabel}
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
          <div className="relative min-h-[min(52dvh,28rem)] sm:min-h-[360px]">
            <div className="absolute top-3 left-3 z-[500] inline-flex rounded-md border bg-background/95 p-0.5 shadow-lg backdrop-blur lg:hidden">
              <Button
                size="sm"
                variant={interstateOnly ? "ghost" : "secondary"}
                className="h-7 px-2 text-xs"
                onClick={() => setInterstateOnly(false)}
              >
                {t("routePage.allRoutes")}
              </Button>
              <Button
                size="sm"
                variant={interstateOnly ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setInterstateOnly(true)}
              >
                {t("routePage.interstateOnly")}
              </Button>
            </div>
            <RouteMap
              showNewHome
              alternatives={filteredAlternatives}
              selectedRouteIndex={routeIndex}
              onSelectRoute={setRouteIndex}
              stops={stats?.stops}
            />
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
                {stats && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start pt-2 border-t">
                    <span className="text-muted-foreground shrink-0">{t("routePage.travelDaysLabel")}</span>
                    <span className="font-medium sm:text-right">{travelDaysLabel}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {stats && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{t("routePage.alternativeRoutes")}</CardTitle>
                <div className="inline-flex rounded-md border p-0.5">
                  <Button
                    size="sm"
                    variant={interstateOnly ? "ghost" : "secondary"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setInterstateOnly(false)}
                  >
                    {t("routePage.allRoutes")}
                  </Button>
                  <Button
                    size="sm"
                    variant={interstateOnly ? "secondary" : "ghost"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setInterstateOnly(true)}
                  >
                    {t("routePage.interstateOnly")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground lg:hidden">
                {t("routePage.alternativeRoutesDesc")}
              </p>
              {interstateOnly && filteredAlternatives.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("routePage.noInterstateRoutes")}</p>
              )}
              <div className="grid gap-2 sm:grid-cols-3 lg:hidden">
                {filteredAlternatives.slice(0, 3).map((alt) => (
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
                    {alt.usesInterstate && alt.interstateRefs?.length ? (
                      <p className="text-[11px] mt-1 text-primary">
                        {t("routePage.interstates")}: {alt.interstateRefs.slice(0, 3).join(", ")}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground hidden lg:block">
                {t("routePage.alternativeRoutesDesc")}
              </p>
              <div className="hidden lg:grid gap-2 sm:grid-cols-3">
                {filteredAlternatives.slice(0, 3).map((alt) => (
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
                    {alt.usesInterstate && alt.interstateRefs?.length ? (
                      <p className="text-[11px] mt-1 text-primary">
                        {t("routePage.interstates")}: {alt.interstateRefs.slice(0, 3).join(", ")}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
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
                            {stopTypeLabel(t, stop.type, stop.restStopKind)}
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
            ) : stopsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("routePage.stopsLoading")}
              </div>
            ) : error === "missing_coords" || !profile.originLat || !profile.destinationLat ? (
              <p className="text-sm text-muted-foreground">{t("routePage.pilotSetCoords")}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("routePage.noStopsYet")}</p>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </PageContainer>
    </>
  );
}
