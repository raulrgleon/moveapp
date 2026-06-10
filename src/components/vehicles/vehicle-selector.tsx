"use client";

import { useCallback, useEffect, useState } from "react";
import { Car, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VehicleInfo, VehicleMake, VehicleModel, VehicleTip } from "@/lib/vehicles/types";
import { createVehicleId } from "@/lib/vehicles/types";
import { formatVehicleLabel } from "@/lib/vehicles/nhtsa";
import { getVehicleTips } from "@/lib/vehicles/recommendations";
import { useLocale, useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

interface VehicleSelectorProps {
  value?: VehicleInfo | null;
  onChange: (vehicle: VehicleInfo) => void;
  showTips?: boolean;
  className?: string;
  layout?: "default" | "compact";
}

const DEFAULT_YEAR = "2019";
const DEFAULT_MAKE = "VOLKSWAGEN";
const DEFAULT_MODEL = "Atlas";

function modelKey(m: VehicleModel): string {
  return m.modelName;
}

function sameVehicle(a: VehicleInfo | null | undefined, b: VehicleInfo): boolean {
  if (!a) return false;
  return (
    a.year === b.year &&
    a.make === b.make &&
    a.model === b.model &&
    a.trim === b.trim &&
    a.makeId === b.makeId &&
    a.modelId === b.modelId
  );
}

const tipStyles = {
  success: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  warning: "border-amber-200 bg-amber-50/80 text-amber-900",
  info: "border-blue-200 bg-blue-50/80 text-blue-900",
} as const;

export function VehicleSelector({
  value,
  onChange,
  showTips = true,
  className,
  layout = "default",
}: VehicleSelectorProps) {
  const t = useT();
  const { locale } = useLocale();
  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [year, setYear] = useState(value?.year ?? DEFAULT_YEAR);
  const [makeId, setMakeId] = useState(value?.makeId ? String(value.makeId) : "");
  const [makeName, setMakeName] = useState(value?.make ?? "");
  const [modelId, setModelId] = useState(value?.modelId ? String(value.modelId) : "");
  const [modelName, setModelName] = useState(value?.model ?? "");
  const [trim, setTrim] = useState(value?.trim ?? "");
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [tips, setTips] = useState<VehicleTip[]>([]);
  const [defaultsApplied, setDefaultsApplied] = useState(Boolean(value?.make));

  useEffect(() => {
    if (!value) return;
    setYear(value.year || DEFAULT_YEAR);
    setMakeId(value.makeId ? String(value.makeId) : "");
    setMakeName(value.make ?? "");
    setModelId(value.modelId ? String(value.modelId) : "");
    setModelName(value.model ?? "");
    setTrim(value.trim ?? "");
    if (value.make) setDefaultsApplied(true);
  }, [value?.id]);

  useEffect(() => {
    fetch("/api/vehicles/years")
      .then((r) => r.json())
      .then((data) => setYears(data))
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    setLoadingMakes(true);
    fetch("/api/vehicles/makes")
      .then((r) => r.json())
      .then((data) => {
        const list: VehicleMake[] = Array.isArray(data) ? data : [];
        setMakes(list);
        if (!defaultsApplied && !value?.make && list.length) {
          const vw = list.find(
            (m) => m.makeName.toUpperCase() === DEFAULT_MAKE.toUpperCase()
          );
          if (vw) {
            setMakeId(String(vw.makeId));
            setMakeName(vw.makeName);
          }
        }
      })
      .catch(() => setMakes([]))
      .finally(() => setLoadingMakes(false));
  }, [defaultsApplied, value?.make]);

  useEffect(() => {
    if (!year || !makeId) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    fetch(`/api/vehicles/models?year=${year}&makeId=${makeId}`)
      .then((r) => r.json())
      .then((data) => {
        const list: VehicleModel[] = Array.isArray(data) ? data : [];
        setModels(list);
        if (modelName) {
          const match = list.find((m) => m.modelName === modelName);
          if (match) {
            setModelId(String(match.modelId || 0));
          }
        } else if (!defaultsApplied && list.length) {
          const atlas = list.find((m) => m.modelName === DEFAULT_MODEL);
          if (atlas) {
            setModelId(String(atlas.modelId || 0));
            setModelName(atlas.modelName);
            setTrim("V6 4Motion");
            setDefaultsApplied(true);
          }
        }
      })
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, [year, makeId, modelName, defaultsApplied]);

  const buildVehicle = useCallback((): VehicleInfo | null => {
    if (!year || !makeName || !modelName) return null;
    return {
      id: value?.id ?? createVehicleId(),
      year,
      makeId: Number(makeId) || 0,
      make: makeName,
      modelId: Number(modelId) || 0,
      model: modelName,
      trim: trim || undefined,
      displayLabel: formatVehicleLabel(year, makeName, modelName, trim),
    };
  }, [year, makeId, makeName, modelId, modelName, trim, value?.id]);

  useEffect(() => {
    const vehicle = buildVehicle();
    if (!vehicle) return;
    if (showTips) setTips(getVehicleTips(vehicle, locale));
  }, [buildVehicle, showTips, locale]);

  useEffect(() => {
    const vehicle = buildVehicle();
    if (!vehicle || sameVehicle(value, vehicle)) return;
    onChange(vehicle);
  }, [buildVehicle, onChange, value]);

  const handleMakeChange = (id: string) => {
    const selected = makes.find((m) => String(m.makeId) === id);
    setMakeId(id);
    setMakeName(selected?.makeName ?? "");
    setModelId("");
    setModelName("");
    setModels([]);
  };

  const handleModelChange = (name: string) => {
    const selected = models.find((m) => m.modelName === name);
    setModelName(name);
    setModelId(String(selected?.modelId ?? 0));
  };

  const makeSelectValue =
    makeId && makes.some((m) => String(m.makeId) === makeId) ? makeId : undefined;

  const modelSelectValue =
    modelName && models.some((m) => m.modelName === modelName) ? modelName : undefined;

  const built = buildVehicle();
  const gridClass =
    layout === "compact"
      ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      : "grid gap-4 sm:grid-cols-2";

  return (
    <div className={cn("space-y-4", className)}>
      {built && layout === "compact" && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium truncate">{built.displayLabel}</span>
        </div>
      )}

      <div className={gridClass}>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("vehicleSelector.year")}</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t("vehicleSelector.selectYear")} />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("vehicleSelector.make")}</Label>
          <Select
            value={makeSelectValue}
            onValueChange={handleMakeChange}
            disabled={loadingMakes}
          >
            <SelectTrigger className="h-10">
              <SelectValue
                placeholder={loadingMakes ? t("common.loading") : t("vehicleSelector.selectMake")}
              />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {makes.map((m) => (
                <SelectItem key={m.makeId} value={String(m.makeId)}>
                  {m.makeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("vehicleSelector.model")}</Label>
          <Select
            value={modelSelectValue}
            onValueChange={handleModelChange}
            disabled={loadingModels || !models.length || !makeSelectValue}
          >
            <SelectTrigger className="h-10">
              <SelectValue
                placeholder={
                  loadingModels
                    ? t("common.loading")
                    : models.length
                      ? t("vehicleSelector.selectModel")
                      : t("vehicleSelector.noModels")
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {models.map((m) => (
                <SelectItem key={modelKey(m)} value={m.modelName}>
                  {m.modelName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("vehicleSelector.trim")}</Label>
          <Input
            className="h-10"
            value={trim}
            onChange={(e) => setTrim(e.target.value)}
            placeholder={t("vehicleSelector.trimPlaceholder")}
          />
        </div>
      </div>

      {built && layout === "default" && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
          <Car className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium">{built.displayLabel}</span>
        </div>
      )}

      {showTips && tips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("vehicleSelector.tipsTitle")}
          </p>
          <div
            className={cn(
              layout === "compact"
                ? "grid gap-2 sm:grid-cols-2"
                : "space-y-2"
            )}
          >
            {tips.slice(0, layout === "compact" ? 2 : 4).map((tip) => (
              <div
                key={tip.id}
                className={cn(
                  "rounded-lg border px-3 py-2.5",
                  tipStyles[tip.type]
                )}
              >
                <p className="text-sm font-medium leading-snug">{tip.title}</p>
                <p className="mt-1 text-xs opacity-80 leading-relaxed">{tip.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(loadingMakes || loadingModels) && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t("vehicleSelector.catalogLoading")}
        </p>
      )}

      {!loadingMakes && !loadingModels && layout === "default" && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3 shrink-0" />
          NHTSA
        </p>
      )}
    </div>
  );
}
