"use client";

import { useEffect, useState } from "react";
import { Car, ChevronDown, Plus, Trash2 } from "lucide-react";
import { VehicleSelector } from "@/components/vehicles/vehicle-selector";
import { useLocale, useT } from "@/contexts/locale-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { createEmptyVehicle } from "@/lib/vehicles/types";
import { getVehicleSummaryLine } from "@/lib/vehicles/recommendations";
import { cn } from "@/lib/utils";

const MAX_VEHICLES = 5;

interface VehicleListEditorProps {
  vehicles: VehicleInfo[];
  onChange: (vehicles: VehicleInfo[]) => void;
  showTips?: boolean;
  /** Fleet layout: compact rows with expand/collapse. Default: stacked cards for onboarding. */
  variant?: "stacked" | "fleet";
  /** Allow zero vehicles (onboarding). Shows empty state until user adds one. */
  allowEmpty?: boolean;
  /** Show per-vehicle needsTransport checkbox (fleet page). */
  showTransportCheckbox?: boolean;
}

export function VehicleListEditor({
  vehicles,
  onChange,
  showTips = true,
  variant = "stacked",
  allowEmpty = false,
  showTransportCheckbox = false,
}: VehicleListEditorProps) {
  const t = useT();
  const { locale } = useLocale();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    variant === "fleet" ? new Set(vehicles.map((v) => v.id)) : new Set()
  );

  // Expand all fleet vehicles once data loads (e.g. after hydration).
  useEffect(() => {
    if (variant !== "fleet" || vehicles.length === 0) return;
    setExpandedIds((prev) => {
      if (prev.size > 0) return prev;
      return new Set(vehicles.map((v) => v.id));
    });
  }, [variant, vehicles]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateAt = (index: number, vehicle: VehicleInfo) => {
    const next = [...vehicles];
    next[index] = vehicle;
    onChange(next);
  };

  const removeAt = (index: number) => {
    if (vehicles.length <= 1 && !allowEmpty) return;
    const removed = vehicles[index];
    onChange(vehicles.filter((_, i) => i !== index));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(removed.id);
      return next;
    });
  };

  const addVehicle = () => {
    if (vehicles.length >= MAX_VEHICLES) return;
    const next = createEmptyVehicle();
    onChange([...vehicles, next]);
    if (variant === "fleet") {
      setExpandedIds((prev) => new Set(prev).add(next.id));
    }
  };

  if (variant === "stacked") {
    if (allowEmpty && vehicles.length === 0) {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center space-y-3">
            <Car className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("vehicleList.noVehicleYet")}</p>
            <Button type="button" variant="default" onClick={addVehicle}>
              <Plus className="h-4 w-4 mr-2" />
              {t("vehicleList.addVehicle")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {vehicles.map((vehicle, index) => (
          <div
            key={vehicle.id}
            className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {index === 0
                  ? t("vehicleList.primary")
                  : t("vehicleList.vehicleN", { n: index + 1 })}
              </p>
              {(vehicles.length > 1 || allowEmpty) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-8"
                  onClick={() => removeAt(index)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {allowEmpty && vehicles.length === 1
                    ? t("vehicleList.noVehicle")
                    : t("vehicleList.remove")}
                </Button>
              )}
            </div>
            <VehicleSelector
              value={vehicle}
              onChange={(updated) => updateAt(index, { ...updated, id: vehicle.id })}
              showTips={showTips && index === 0}
            />
            {showTransportCheckbox && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id={`transport-${vehicle.id}`}
                  checked={vehicle.needsTransport ?? false}
                  onCheckedChange={(v) =>
                    updateAt(index, { ...vehicle, needsTransport: Boolean(v) })
                  }
                />
                <Label htmlFor={`transport-${vehicle.id}`} className="font-normal text-sm">
                  {t("vehicleList.needsTransport")}
                </Label>
              </div>
            )}
          </div>
        ))}

        {vehicles.length < MAX_VEHICLES && (
          <Button type="button" variant="outline" className="w-full" onClick={addVehicle}>
            <Plus className="h-4 w-4 mr-2" />
            {t("vehicleList.addAnother")}
          </Button>
        )}

        {vehicles.length >= MAX_VEHICLES && (
          <p className="text-xs text-muted-foreground text-center">
            {t("vehicleList.maxVehicles", { max: MAX_VEHICLES })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {vehicles.map((vehicle, index) => {
        const isExpanded = expandedIds.has(vehicle.id);
        const summary = getVehicleSummaryLine(vehicle, locale);

        return (
          <div
            key={vehicle.id}
            className={cn(
              "rounded-xl border bg-card transition-shadow",
              isExpanded && "shadow-md ring-1 ring-primary/20"
            )}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left"
              onClick={() => toggleExpanded(vehicle.id)}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "secondary"} className="text-[10px]">
                    {index === 0
                      ? t("vehicles.primary")
                      : t("vehicles.vehicleN", { n: index + 1 })}
                  </Badge>
                  {vehicle.year && vehicle.make && (
                    <span className="truncate text-sm font-semibold">{vehicle.displayLabel}</span>
                  )}
                  {vehicle.combMpg && vehicle.combMpg > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {vehicle.combMpg} MPG
                    </Badge>
                  )}
                  {(!vehicle.year || !vehicle.make) && (
                    <span className="text-sm text-muted-foreground">
                      {t("vehicleSelector.selectMake")}
                    </span>
                  )}
                </div>
                {summary && vehicle.make && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{summary}</p>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {isExpanded && (
              <div className="border-t px-4 pb-4 pt-3">
                <VehicleSelector
                  value={vehicle}
                  onChange={(updated) => updateAt(index, { ...updated, id: vehicle.id })}
                  showTips={showTips && index === 0}
                  layout="compact"
                />
                {showTransportCheckbox && (
                  <div className="mt-3 flex items-center space-x-2">
                    <Checkbox
                      id={`fleet-transport-${vehicle.id}`}
                      checked={vehicle.needsTransport ?? false}
                      onCheckedChange={(v) =>
                        updateAt(index, { ...vehicle, needsTransport: Boolean(v) })
                      }
                    />
                    <Label htmlFor={`fleet-transport-${vehicle.id}`} className="font-normal text-sm">
                      {t("vehicleList.needsTransport")}
                    </Label>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  {vehicles.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeAt(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("vehicleList.remove")}
                    </Button>
                  ) : (
                    <span />
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleExpanded(vehicle.id)}
                  >
                    {t("vehicles.collapseVehicle")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {vehicles.length < MAX_VEHICLES && (
        <button
          type="button"
          onClick={addVehicle}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          {t("vehicleList.addAnother")}
        </button>
      )}

      {vehicles.length >= MAX_VEHICLES && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          {t("vehicleList.maxVehicles", { max: MAX_VEHICLES })}
        </p>
      )}
    </div>
  );
}
