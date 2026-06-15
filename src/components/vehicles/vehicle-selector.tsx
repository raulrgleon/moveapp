"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { modelOptionKey, parseModelOptionKey } from "@/lib/vehicles/us-vehicle-makes";
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

function isCompleteVehicle(vehicle: VehicleInfo | null | undefined): boolean {
  return Boolean(vehicle?.year && vehicle?.make?.trim() && vehicle?.model?.trim());
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
  const vehicleId = value?.id ?? createVehicleId();
  const modelsRequestRef = useRef(0);

  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [year, setYear] = useState(value?.year ?? "");
  const [makeId, setMakeId] = useState(value?.makeId ? String(value.makeId) : "");
  const [makeName, setMakeName] = useState(value?.make ?? "");
  const [modelKey, setModelKey] = useState(
    value?.model ? modelOptionKey(value.modelId ?? 0, value.model) : ""
  );
  const [trim, setTrim] = useState(value?.trim ?? "");
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [tips, setTips] = useState<VehicleTip[]>([]);

  const selectedModel = useMemo(() => {
    if (!modelKey) return null;
    const parsed = parseModelOptionKey(modelKey);
    return models.find(
      (m) =>
        m.modelName === parsed.modelName &&
        (m.modelId === parsed.modelId || parsed.modelId === 0)
    );
  }, [modelKey, models]);

  const modelName = selectedModel?.modelName ?? "";
  const modelId = selectedModel ? String(selectedModel.modelId) : "";

  useEffect(() => {
    if (!value?.make && !value?.model) return;
    setYear(value.year ?? "");
    setMakeId(value.makeId ? String(value.makeId) : "");
    setMakeName(value.make ?? "");
    setModelKey(value.model ? modelOptionKey(value.modelId ?? 0, value.model) : "");
    setTrim(value.trim ?? "");
  }, [value?.id, value?.year, value?.make, value?.model, value?.makeId, value?.modelId, value?.trim]);

  useEffect(() => {
    fetch("/api/vehicles/years")
      .then((r) => r.json())
      .then((data) => setYears(Array.isArray(data) ? data : []))
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    setLoadingMakes(true);
    fetch("/api/vehicles/makes")
      .then((r) => r.json())
      .then((data) => setMakes(Array.isArray(data) ? data : []))
      .catch(() => setMakes([]))
      .finally(() => setLoadingMakes(false));
  }, []);

  const loadModels = useCallback(async (targetYear: string, targetMakeId: string) => {
    if (!targetYear || !targetMakeId) {
      setModels([]);
      return [];
    }

    const requestId = ++modelsRequestRef.current;
    setLoadingModels(true);

    try {
      const res = await fetch(
        `/api/vehicles/models?year=${targetYear}&makeId=${targetMakeId}`
      );
      const data = (await res.json()) as VehicleModel[];
      const list = Array.isArray(data) ? data : [];

      if (requestId !== modelsRequestRef.current) return [];

      setModels(list);
      setModelKey((current) => {
        if (!current) return "";
        const parsed = parseModelOptionKey(current);
        const stillValid = list.some((m) => m.modelName === parsed.modelName);
        return stillValid ? current : "";
      });

      return list;
    } catch {
      if (requestId === modelsRequestRef.current) setModels([]);
      return [];
    } finally {
      if (requestId === modelsRequestRef.current) setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    void loadModels(year, makeId);
  }, [year, makeId, loadModels]);

  const buildVehicle = useCallback((): VehicleInfo | null => {
    if (!year || !makeName.trim() || !modelName.trim()) return null;
    return {
      id: vehicleId,
      year,
      makeId: Number(makeId) || 0,
      make: makeName,
      modelId: Number(modelId) || 0,
      model: modelName,
      trim: trim || undefined,
      displayLabel: formatVehicleLabel(year, makeName, modelName, trim),
    };
  }, [year, makeId, makeName, modelId, modelName, trim, vehicleId]);

  useEffect(() => {
    const vehicle = buildVehicle();
    if (!vehicle) {
      setTips([]);
      return;
    }
    if (showTips) setTips(getVehicleTips(vehicle, locale));
  }, [buildVehicle, showTips, locale]);

  useEffect(() => {
    const vehicle = buildVehicle();
    if (!vehicle || sameVehicle(value, vehicle)) return;

    let cancelled = false;
    void (async () => {
      let enriched = vehicle;
      try {
        const params = new URLSearchParams({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
        });
        if (vehicle.trim) params.set("trim", vehicle.trim);
        const res = await fetch(`/api/vehicles/fuel-economy?${params.toString()}`);
        if (res.ok) {
          const mpg = (await res.json()) as {
            combMpg?: number;
            cityMpg?: number;
            highwayMpg?: number;
            fuelType?: string;
          };
          enriched = {
            ...vehicle,
            combMpg: mpg.combMpg,
            cityMpg: mpg.cityMpg,
            highwayMpg: mpg.highwayMpg,
            fuelType: mpg.fuelType,
          };
        }
      } catch {
        /* use vehicle without mpg */
      }
      if (!cancelled) onChange(enriched);
    })();

    return () => {
      cancelled = true;
    };
  }, [buildVehicle, onChange, value]);

  const notifyPartial = useCallback(
    (patch: Partial<VehicleInfo>) => {
      onChange({
        id: vehicleId,
        year: patch.year ?? year,
        makeId: (patch.makeId ?? Number(makeId)) || 0,
        make: patch.make ?? makeName,
        modelId: patch.modelId ?? 0,
        model: patch.model ?? "",
        trim: (patch.trim ?? trim) || undefined,
        displayLabel: patch.displayLabel ?? "",
      });
    },
    [onChange, vehicleId, year, makeId, makeName, trim]
  );

  const handleYearChange = (nextYear: string) => {
    setYear(nextYear);
    setModelKey("");
    setModels([]);
    notifyPartial({
      year: nextYear,
      model: "",
      modelId: 0,
      displayLabel: "",
    });
  };

  const handleMakeChange = (id: string) => {
    const selected = makes.find((m) => String(m.makeId) === id);
    setMakeId(id);
    setMakeName(selected?.makeName ?? "");
    setModelKey("");
    setModels([]);
    notifyPartial({
      makeId: Number(id) || 0,
      make: selected?.makeName ?? "",
      model: "",
      modelId: 0,
      displayLabel: "",
    });
  };

  const handleModelChange = (key: string) => {
    setModelKey(key);
  };

  const makeSelectValue =
    makeId && makes.some((m) => String(m.makeId) === makeId) ? makeId : undefined;

  const modelSelectValue =
    modelKey && models.some((m) => modelOptionKey(m.modelId, m.modelName) === modelKey)
      ? modelKey
      : undefined;

  const built = buildVehicle();
  const gridClass =
    layout === "compact"
      ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
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
          <Select value={year || undefined} onValueChange={handleYearChange}>
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
            disabled={loadingMakes || !year}
          >
            <SelectTrigger className="h-10">
              <SelectValue
                placeholder={
                  !year
                    ? t("vehicleSelector.selectYearFirst")
                    : loadingMakes
                      ? t("common.loading")
                      : t("vehicleSelector.selectMake")
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72">
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
            disabled={loadingModels || !makeSelectValue || !year}
          >
            <SelectTrigger className="h-10">
              <SelectValue
                placeholder={
                  !year
                    ? t("vehicleSelector.selectYearFirst")
                    : !makeSelectValue
                      ? t("vehicleSelector.selectMakeFirst")
                      : loadingModels
                        ? t("common.loading")
                        : models.length
                          ? t("vehicleSelector.selectModel")
                          : t("vehicleSelector.noModels")
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {models.map((m) => {
                const key = modelOptionKey(m.modelId, m.modelName);
                return (
                  <SelectItem key={key} value={key}>
                    {m.modelName}
                  </SelectItem>
                );
              })}
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
            disabled={!isCompleteVehicle(built)}
          />
        </div>
      </div>

      {built && layout === "default" && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
          <Car className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium">{built.displayLabel}</span>
        </div>
      )}

      {!built && layout === "default" && (
        <p className="text-xs text-muted-foreground">{t("vehicleSelector.helper")}</p>
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
          {t("vehicleSelector.dataSource")}
        </p>
      )}
    </div>
  );
}
