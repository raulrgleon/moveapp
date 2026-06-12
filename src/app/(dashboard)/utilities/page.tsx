"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Droplets,
  Flame,
  Home,
  Lock,
  Loader2,
  MapPin,
  Sparkles,
  Tv,
  Wifi,
  Zap,
} from "lucide-react";
import {
  AddressAutocomplete,
  AddressConfirmedBadge,
} from "@/components/address/address-autocomplete";
import { parseCityStateLabel } from "@/lib/geo/address-region";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { UtilityProviderCard } from "@/components/dashboard/utility-provider-card";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UTILITY_CATEGORIES } from "@/lib/constants";
import type { DestinationUtilityProvider } from "@/lib/types";
import {
  getUtilityBestPicks,
  sumUtilityMonthlyEstimate,
} from "@/lib/utilities/recommendations";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electricity: Zap,
  water: Droplets,
  gas: Flame,
  internet: Wifi,
  fiber: Wifi,
  cable: Tv,
  waste: Home,
  security: Home,
};

function personalizeProviders(
  address: string,
  providers: DestinationUtilityProvider[]
): DestinationUtilityProvider[] {
  const shortAddress = address.split(",").slice(0, 2).join(",").trim();
  return providers.map((p) => ({
    ...p,
    coverageNote: p.availableAtAddress
      ? `${p.coverageNote} — ${shortAddress}`
      : p.coverageNote,
  }));
}

export default function UtilitiesPage() {
  const t = useT();
  const [filter, setFilter] = useState("all");
  const [providers, setProviders] = useState<DestinationUtilityProvider[]>([]);
  const [utilityNote, setUtilityNote] = useState("");
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [contractedIds, setContractedIds] = useState<Set<string>>(new Set());
  const {
    profile,
    isAddressConfirmed,
    isHydrated,
    destinationAddress,
    destination,
    lat,
    lon,
    confirmAddress,
    clearAddress,
    canEditProfile,
    canEdit,
  } = useMove();

  const destRegion = useMemo(() => {
    const parsed = parseCityStateLabel(profile.destination);
    return {
      city: parsed.city,
      state: parsed.state,
      lat: profile.destinationLat,
      lon: profile.destinationLon,
    };
  }, [profile.destination, profile.destinationLat, profile.destinationLon]);

  useEffect(() => {
    if (!isAddressConfirmed || lat == null || lon == null) {
      setProviders([]);
      setUtilityNote("");
      return;
    }

    let cancelled = false;
    async function load() {
      setLoadingProviders(true);
      setLoadError(false);
      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lon: String(lon),
          address: destinationAddress,
        });
        const res = await fetch(`/api/utilities?${params}`, { credentials: "include" });
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as {
          providers: DestinationUtilityProvider[];
          summary: string;
        };
        if (!cancelled) {
          setProviders(personalizeProviders(destinationAddress, data.providers));
          setUtilityNote(data.summary);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoadingProviders(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAddressConfirmed, destinationAddress, lat, lon]);

  const filtered =
    filter === "all"
      ? providers
      : filter === "internet"
        ? providers.filter(
            (p) => p.category === "internet" || p.category === "fiber"
          )
        : providers.filter((p) => p.category === filter);

  const bestPicks = useMemo(
    () => getUtilityBestPicks(providers),
    [providers]
  );

  const estimatedMonthlyTotal = useMemo(
    () => sumUtilityMonthlyEstimate(bestPicks),
    [bestPicks]
  );

  const utilityNoteText = isAddressConfirmed
    ? utilityNote || t("utilities.addressConfirmedNote")
    : t("utilities.pageDescLocked");

  if (!isHydrated) {
    return (
      <>
        <DashboardHeader title={t("utilities.title")} description={t("common.loading")} />
        <PageContainer>
          <div className="flex justify-center py-20 text-muted-foreground text-sm">
            {t("common.loading")}
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <DashboardHeader title={t("utilities.title")} description={t("utilities.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("utilities.pageTitle")}
          description={
            isAddressConfirmed
              ? t("utilities.pageDescConfirmed")
              : t("utilities.pageDescLocked")
          }
        />

        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {t("utilities.newHomeAddress")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressAutocomplete
              onSelect={canEditProfile ? confirmAddress : () => undefined}
              placeholder={t("address.placeholder")}
              initialValue={isAddressConfirmed ? destinationAddress : ""}
              disabled={!canEditProfile}
              region={destRegion}
            />
            {isAddressConfirmed ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <AddressConfirmedBadge address={destinationAddress} />
                {canEditProfile && (
                  <Button variant="ghost" size="sm" onClick={clearAddress}>
                    {t("utilities.changeAddress")}
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("utilities.addressHint")}</p>
            )}
          </CardContent>
        </Card>

        {!isAddressConfirmed ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{t("utilities.lockedTitle")}</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t("utilities.lockedDesc")}
              </p>
            </CardContent>
          </Card>
        ) : loadingProviders ? (
          <Card>
            <CardContent className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("utilities.loading")}
            </CardContent>
          </Card>
        ) : loadError ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4 text-sm text-muted-foreground">{t("utilities.loadError")}</CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">
                        {t("utilities.confirmedAddress")}
                      </p>
                      <p className="mt-1 text-base sm:text-lg font-semibold break-words">
                        {destinationAddress}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <div className="rounded-lg bg-background border px-4 py-3 text-center min-w-[120px]">
                      <p className="text-xs text-muted-foreground">{t("utilities.estMonthlyTotal")}</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(estimatedMonthlyTotal)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-background border px-4 py-3 text-center min-w-[120px]">
                      <p className="text-xs text-muted-foreground">{t("utilities.bestPicks")}</p>
                      <p className="text-xl font-bold">{bestPicks.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  {t("utilities.aiRecommendations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{utilityNoteText}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {bestPicks.map((pick) => (
                    <div
                      key={pick.id}
                      className="rounded-lg border bg-muted/30 px-3 py-3 space-y-1"
                    >
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {pick.categoryLabel}
                      </p>
                      <p className="text-sm font-semibold leading-snug">{pick.name}</p>
                      <p className="text-base font-bold text-primary">
                        {formatCurrency(pick.estimatedMonthlyPrice)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {pick.priceUnit}
                        </span>
                      </p>
                      {pick.speedOrCapacity && (
                        <p className="text-xs text-muted-foreground">{pick.speedOrCapacity}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t("utilities.filterService")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {UTILITY_CATEGORIES.map((cat) => {
                  const Icon = cat.id !== "all" ? CATEGORY_ICONS[cat.id] : null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFilter(cat.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                        filter === cat.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {t(cat.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-2">
              {filtered.map((provider) => (
                <UtilityProviderCard
                  key={provider.id}
                  provider={provider}
                  contracted={contractedIds.has(provider.id)}
                  onContract={
                    canEdit
                      ? async (p) => {
                          await fetch("/api/utilities/contract", {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              providerName: p.name,
                              category: p.categoryLabel,
                            }),
                          });
                          setContractedIds((prev) => new Set(prev).add(p.id));
                        }
                      : undefined
                  }
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                {t("utilities.noProviders")}
              </p>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
