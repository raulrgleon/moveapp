"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CloudRain, CloudSun, Loader2, MapPin, Settings, Thermometer } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import type { RouteWeatherResponse } from "@/lib/weather/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function WeatherIcon({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-10 w-10" width={40} height={40} />
  );
}

interface RouteWeatherPanelProps {
  compact?: boolean;
}

export function RouteWeatherPanel({ compact = false }: RouteWeatherPanelProps) {
  const t = useT();
  const { locale } = useLocale();
  const { profile, isHydrated, lat, lon, profileVersion } = useMove();
  const [data, setData] = useState<RouteWeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"missing_cities" | "fetch_failed" | null>(null);

  const hasRoute = useMemo(() => {
    const hasOrigin =
      Boolean(profile.origin?.trim()) ||
      (profile.originLat != null && profile.originLon != null);
    const hasDestination =
      Boolean(profile.destination?.trim()) ||
      (profile.destinationLat != null && profile.destinationLon != null) ||
      (lat != null && lon != null);
    return hasOrigin && hasDestination;
  }, [profile, lat, lon]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!hasRoute) {
      setLoading(false);
      setError("missing_cities");
      setData(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          origin: profile.origin,
          destination: profile.destination,
          moveDate: profile.moveDate,
        });
        if (profile.originLat != null) params.set("originLat", String(profile.originLat));
        if (profile.originLon != null) params.set("originLon", String(profile.originLon));
        const destLat = profile.destinationLat ?? lat;
        const destLon = profile.destinationLon ?? lon;
        if (destLat != null) params.set("destinationLat", String(destLat));
        if (destLon != null) params.set("destinationLon", String(destLon));

        const res = await apiFetch(`/api/weather?${params.toString()}`);
        const json = (await res.json()) as RouteWeatherResponse;
        if (!cancelled) {
          setData(json);
          if (!json.origin && !json.destination) {
            setError("fetch_failed");
          }
        }
      } catch {
        if (!cancelled) setError("fetch_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    isHydrated,
    hasRoute,
    profile.origin,
    profile.destination,
    profile.moveDate,
    profile.originLat,
    profile.originLon,
    profile.destinationLat,
    profile.destinationLon,
    lat,
    lon,
    profileVersion,
  ]);

  if (!isHydrated || loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("weather.loading")}</span>
        </CardContent>
      </Card>
    );
  }

  if (error === "missing_cities") {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <CloudSun className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">{t("weather.configureRoute")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("weather.configureRouteHint")}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4 mr-2" />
              {t("nav.settings")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error === "fetch_failed" || !data) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex gap-3">
          <CloudRain className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-sm">{t("routePage.weatherAlert")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("weather.unavailable")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const primaryAlert = data.alerts[0];
  const forecastNoteDays = data.forecastNote?.startsWith("forecast_beyond_")
    ? Number(data.forecastNote.split(":")[1] ?? 0)
    : null;

  return (
    <div className="space-y-4">
      {primaryAlert && (
        <Card
          className={cn(
            primaryAlert.severity === "warning"
              ? "border-amber-200 bg-amber-50/50"
              : "border-sky-200 bg-sky-50/40"
          )}
        >
          <CardContent className="p-4 flex gap-3">
            <CloudRain
              className={cn(
                "h-5 w-5 shrink-0",
                primaryAlert.severity === "warning" ? "text-amber-600" : "text-sky-600"
              )}
            />
            <div>
              <p className="font-medium text-sm">{t("routePage.weatherAlert")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{primaryAlert.message}</p>
              {data.alerts.length > 1 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  +{data.alerts.length - 1} {t("weather.moreAlerts")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CloudSun className="h-4 w-4 text-primary" />
            {t("weather.routeConditions")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[data.origin, data.destination].map(
              (snap, idx) =>
                snap && (
                  <div key={idx} className="flex items-center gap-3 rounded-lg border p-3">
                    <WeatherIcon src={snap.icon} alt={snap.condition} />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {idx === 0 ? t("routePage.origin") : t("routePage.destination")}
                      </p>
                      <p className="font-medium text-sm truncate">{snap.location}</p>
                      <p className="text-sm text-muted-foreground">
                        {snap.tempF}°F · {snap.condition}
                      </p>
                    </div>
                  </div>
                )
            )}
          </div>

          {data.moveDayForecast && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="font-medium flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-primary" />
                {t("weather.moveDayForecast", {
                  date: new Date(data.moveDayForecast.date).toLocaleDateString(
                    locale === "es" ? "es-US" : "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  ),
                })}
              </p>
              <p className="mt-1 text-muted-foreground">
                {data.moveDayForecast.condition} · {data.moveDayForecast.minTempF}–
                {data.moveDayForecast.maxTempF}°F · {data.moveDayForecast.chanceOfRain}%{" "}
                {t("weather.rainChance")}
              </p>
            </div>
          )}

          {!data.moveDayForecast && forecastNoteDays != null && forecastNoteDays > 0 && (
            <p className="text-sm text-muted-foreground rounded-lg bg-muted/30 p-3">
              {t("weather.forecastLater", { days: forecastNoteDays })}
            </p>
          )}

          {!compact && data.stopWeather.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t("weather.alongRoute")}
              </p>
              <div className="flex flex-wrap gap-2">
                {data.stopWeather.map((stop) => (
                  <div
                    key={stop.location}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                  >
                    <WeatherIcon src={stop.icon} alt={stop.condition} />
                    <span className="font-medium">{stop.location.split(",")[0]}</span>
                    <span className="text-muted-foreground">{stop.tempF}°F</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">{t("weather.attribution")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
