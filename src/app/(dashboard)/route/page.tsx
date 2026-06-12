"use client";

import dynamic from "next/dynamic";
import { Fuel, Hotel, Loader2, MapPin, PawPrint, Route as RouteIcon } from "lucide-react";
import { RouteWeatherPanel } from "@/components/dashboard/route-weather-panel";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouteStats } from "@/hooks/use-route-stats";

const RouteMap = dynamic(
  () => import("@/components/dashboard/route-map-wrapper").then((m) => m.RouteMapWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[280px] sm:min-h-[360px] rounded-xl border bg-muted/30 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    ),
  }
);

const stopIcons = {
  gas: Fuel,
  hotel: Hotel,
  rest: MapPin,
  pet_hotel: PawPrint,
};

export default function RoutePage() {
  const t = useT();
  const { profile } = useMove();
  const { stats, loading } = useRouteStats();

  const distanceLabel = stats
    ? `${stats.distanceMiles.toLocaleString()} miles`
    : loading
      ? "…"
      : "—";
  const driveTimeLabel = stats?.driveTimeLabel ?? (loading ? "…" : "—");
  const stopCount = stats?.stops.length ?? stats?.stopCount ?? 0;
  const driveDays =
    stats && stats.durationHours > 10
      ? t("routePage.multiDayRoute")
      : t("routePage.twoDayRoute");

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
        />

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
            subtext="Gas, hotels, rest"
            icon={MapPin}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RouteMap className="min-h-[280px] sm:min-h-[360px]" showNewHome />

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
                  return (
                    <div key={stop.id} className="flex gap-3 rounded-lg border p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{stop.name}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {stop.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{stop.location}</p>
                        {stop.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{stop.notes}</p>
                        )}
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
