"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Droplets,
  Flame,
  Home,
  Lock,
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
  DESTINATION_UTILITIES,
  UTILITY_AI_SUMMARY,
} from "@/lib/mock-data";
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
  address: string
): DestinationUtilityProvider[] {
  const shortAddress = address.split(",").slice(0, 2).join(",").trim();
  return DESTINATION_UTILITIES.map((p) => ({
    ...p,
    coverageNote: p.availableAtAddress
      ? `Verified for ${shortAddress} via address lookup`
      : p.coverageNote,
  }));
}

export default function UtilitiesPage() {
  const t = useT();
  const [filter, setFilter] = useState("all");
  const {
    isAddressConfirmed,
    isHydrated,
    destinationAddress,
    destination,
    confirmAddress,
    clearAddress,
  } = useMove();

  const providers = useMemo(
    () =>
      isAddressConfirmed
        ? personalizeProviders(destinationAddress)
        : DESTINATION_UTILITIES,
    [isAddressConfirmed, destinationAddress]
  );

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

  const utilityNote = isAddressConfirmed
    ? t("utilities.addressConfirmedNote")
    : UTILITY_AI_SUMMARY.note;

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
              onSelect={confirmAddress}
              placeholder="Type street, city, state… e.g. 1842 Harper Rd, Huntington WV"
              initialValue={isAddressConfirmed ? destinationAddress : ""}
            />
            {isAddressConfirmed ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <AddressConfirmedBadge address={destinationAddress} />
                <Button variant="ghost" size="sm" onClick={clearAddress}>
                  Change address
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Suggestions appear as you type. Select an address to load electricity,
                water, gas, internet, and fiber options for that location.
              </p>
            )}
          </CardContent>
        </Card>

        {!isAddressConfirmed ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Utilities locked</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Enter and confirm your new home address above to see ranked utility
                providers, pricing, and availability for your exact location.
              </p>
            </CardContent>
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
                        Confirmed address
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
                      <p className="text-xs text-muted-foreground">Best picks</p>
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
                <p className="text-sm text-muted-foreground">{utilityNote}</p>
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
                <UtilityProviderCard key={provider.id} provider={provider} />
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No providers found for this category.
              </p>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
