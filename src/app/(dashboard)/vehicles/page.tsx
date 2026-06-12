"use client";

import {
  Car,
  Fuel,
  Package,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { VehicleListEditor } from "@/components/vehicles/vehicle-list-editor";
import { useLocale, useT } from "@/contexts/locale-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMove } from "@/contexts/move-context";
import { VEHICLE_OPTIONS } from "@/lib/mock-data";
import { getMultiVehicleSummary } from "@/lib/vehicles/recommendations";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const OPTION_ICONS: Record<string, typeof Car> = {
  "1": Car,
  "2": Truck,
  "3": Package,
  "4": Truck,
};

export default function VehiclesPage() {
  const t = useT();
  const { locale } = useLocale();
  const { vehicles, setVehicles, vehicle } = useMove();
  const recommended = VEHICLE_OPTIONS.find((o) => o.recommended);

  const optionTitles: Record<string, string> = {
    "1": t("vehicles.driveOwn"),
    "2": t("vehicles.rentTrailer"),
    "3": t("vehicles.shipVehicle"),
    "4": t("vehicles.towDolly"),
  };

  const otherOptions = VEHICLE_OPTIONS.filter((o) => !o.recommended);

  return (
    <>
      <DashboardHeader title={t("vehicles.title")} description={t("vehicles.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("vehicles.pageTitle")}
          description={getMultiVehicleSummary(vehicles, locale)}
        />

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="sm:col-span-1">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("vehicles.fleetCount", { count: vehicles.length })}</p>
                <p className="text-sm font-semibold truncate max-w-[12rem]">
                  {vehicle.displayLabel}
                </p>
              </div>
            </CardContent>
          </Card>
          {recommended && (
            <>
              <Card className="sm:col-span-1 border-primary/30 bg-primary/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("vehicles.aiPick")}</p>
                    <p className="text-sm font-semibold">{optionTitles[recommended.id]}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="sm:col-span-1">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(recommended.estimatedCost)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("vehicles.estCost")}</p>
                    <p className="text-sm font-medium">{t("common.recommended")}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("vehicles.fleetTitle")}</CardTitle>
            <CardDescription>{t("vehicles.fleetDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleListEditor
              vehicles={vehicles}
              onChange={setVehicles}
              showTips
              variant="fleet"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("vehicles.transportTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("vehicles.transportDesc")}</p>
          </div>

          {recommended && (
            <Card className="overflow-hidden border-primary shadow-md">
              <div className="flex flex-col md:flex-row">
                <div className="flex flex-1 flex-col justify-between gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {optionTitles[recommended.id]}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {t("vehicles.driveOptionDesc", { vehicle: vehicle.displayLabel })}
                        </p>
                      </div>
                    </div>
                    <Badge className="shrink-0 gap-1">
                      <Sparkles className="h-3 w-3" />
                      {t("common.recommended")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("vehicles.estCost")}</p>
                      <p className="text-2xl font-bold">{formatCurrency(recommended.estimatedCost)}</p>
                    </div>
                    {recommended.fuelEstimate !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Fuel className="h-3 w-3" /> {t("vehicles.fuel")}
                        </p>
                        <p className="text-lg font-semibold">{formatCurrency(recommended.fuelEstimate)}</p>
                      </div>
                    )}
                    {recommended.wearAndTear !== undefined && recommended.wearAndTear > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> {t("vehicles.wear")}
                        </p>
                        <p className="text-lg font-semibold">{formatCurrency(recommended.wearAndTear)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {otherOptions.map((option) => {
              const Icon = OPTION_ICONS[option.id] ?? Car;
              return (
                <Card
                  key={option.id}
                  className="flex flex-col transition-colors hover:border-muted-foreground/30"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base leading-snug">
                        {optionTitles[option.id] ?? option.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <p className="text-sm text-muted-foreground flex-1">
                      {option.description}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {t("vehicles.estCost")}
                        </p>
                        <p className="font-semibold text-sm">{formatCurrency(option.estimatedCost)}</p>
                      </div>
                      {option.fuelEstimate !== undefined && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {t("vehicles.fuel")}
                          </p>
                          <p className="font-semibold text-sm">{formatCurrency(option.fuelEstimate)}</p>
                        </div>
                      )}
                      {option.wearAndTear !== undefined && option.wearAndTear > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {t("vehicles.wear")}
                          </p>
                          <p className="font-semibold text-sm">{formatCurrency(option.wearAndTear)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("vehicles.comparison")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p className="flex gap-2">
              <span className="font-semibold shrink-0">{t("vehicles.driveTrailer")}</span>
              <span className="text-muted-foreground">
                {t("vehicles.driveTrailerDesc", {
                  make: vehicle.make,
                  model: vehicle.model,
                })}
              </span>
            </p>
            <p className="text-muted-foreground">{t("vehicles.shipDesc")}</p>
            {vehicles.length > 1 && (
              <p className="text-muted-foreground">{t("vehicles.multiVehicle")}</p>
            )}
            <p className={cn("text-muted-foreground text-xs pt-1 border-t")}>
              {t("vehicles.towDollyNote")}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
