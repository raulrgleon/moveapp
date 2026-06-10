"use client";

import { Car, Fuel, Sparkles, Wrench } from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { VehicleListEditor } from "@/components/vehicles/vehicle-list-editor";
import { useLocale, useT } from "@/contexts/locale-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMove } from "@/contexts/move-context";
import { VEHICLE_OPTIONS } from "@/lib/mock-data";
import {
  getMultiVehicleSummary,
  getVehicleSummaryLine,
} from "@/lib/vehicles/recommendations";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function VehiclesPage() {
  const t = useT();
  const { locale } = useLocale();
  const { vehicles, setVehicles, vehicle } = useMove();
  const primarySummary = getVehicleSummaryLine(vehicle, locale);

  const optionTitles: Record<string, string> = {
    "1": t("vehicles.driveOwn"),
    "2": t("vehicles.rentTrailer"),
    "3": t("vehicles.shipVehicle"),
    "4": t("vehicles.towDolly"),
  };

  return (
    <>
      <DashboardHeader title={t("vehicles.title")} description={t("vehicles.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("vehicles.pageTitle")}
          description={getMultiVehicleSummary(vehicles, locale)}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("vehicles.configure")}</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleListEditor vehicles={vehicles} onChange={setVehicles} showTips />
          </CardContent>
        </Card>

        {vehicles.map((v, index) => (
          <Card key={v.id}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                <Car className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {index === 0
                    ? t("vehicles.primary")
                    : t("vehicles.vehicleN", { n: index + 1 })}
                </p>
                <p className="font-semibold">{v.displayLabel}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getVehicleSummaryLine(v, locale)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="grid gap-6 md:grid-cols-2">
          {VEHICLE_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={cn(option.recommended && "border-primary shadow-md")}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {optionTitles[option.id] ?? option.title}
                  </CardTitle>
                  {option.recommended && (
                    <Badge className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {t("common.recommended")}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {option.id === "1"
                    ? t("vehicles.driveOptionDesc", { vehicle: vehicle.displayLabel })
                    : option.description}
                </p>
                <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("vehicles.estCost")}</p>
                    <p className="font-semibold">{formatCurrency(option.estimatedCost)}</p>
                  </div>
                  {option.fuelEstimate !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Fuel className="h-3 w-3" /> {t("vehicles.fuel")}
                      </p>
                      <p className="font-semibold">{formatCurrency(option.fuelEstimate)}</p>
                    </div>
                  )}
                  {option.wearAndTear !== undefined && option.wearAndTear > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Wrench className="h-3 w-3" /> {t("vehicles.wear")}
                      </p>
                      <p className="font-semibold">{formatCurrency(option.wearAndTear)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("vehicles.comparison")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>{t("vehicles.driveTrailer")}</strong>{" "}
              {t("vehicles.driveTrailerDesc", {
                make: vehicle.make,
                model: vehicle.model,
              })}
            </p>
            <p>
              <strong>{t("vehicles.shipDesc")}</strong>
            </p>
            {vehicles.length > 1 && (
              <p>
                <strong>{t("vehicles.multiVehicle")}</strong>
              </p>
            )}
            <p>
              <strong>{t("vehicles.towDollyNote")}</strong>
            </p>
            <p className="text-muted-foreground text-xs pt-2">{primarySummary}</p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
