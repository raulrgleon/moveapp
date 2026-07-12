"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Car, CheckCircle2, Fuel, Info, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
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
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface EpaOption {
  id: string;
  text: string;
}

interface MpgPayload {
  combMpg?: number;
  cityMpg?: number;
  highwayMpg?: number;
  fuelType?: string;
  epaVehicleId?: string;
  optionText?: string;
}

interface VehicleSelectorProps {
  value?: VehicleInfo | null;
  onChange: (vehicle: VehicleInfo) => void;
  showTips?: boolean;
  className?: string;
  layout?: "default" | "compact";
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
  const optionsRequestRef = useRef(0);
  const mpgRequestRef = useRef(0);

  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [epaOptions, setEpaOptions] = useState<EpaOption[]>([]);
  const [year, setYear] = useState(value?.year ?? "");
  const [makeId, setMakeId] = useState(value?.makeId ? String(value.makeId) : "");
  const [makeName, setMakeName] = useState(value?.make ?? "");
  const [modelKey, setModelKey] = useState(
    value?.model ? modelOptionKey(value.modelId ?? 0, value.model) : ""
  );
  const [epaId, setEpaId] = useState(value?.epaVehicleId ?? "");
  const [mpg, setMpg] = useState<MpgPayload | null>(
    value?.combMpg
      ? {
          combMpg: value.combMpg,
          cityMpg: value.cityMpg,
          highwayMpg: value.highwayMpg,
          fuelType: value.fuelType,
          epaVehicleId: value.epaVehicleId,
          optionText: value.trim,
        }
      : null
  );
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingMpg, setLoadingMpg] = useState(false);
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
  const selectedOptionText = epaOptions.find((o) => o.id === epaId)?.text ?? value?.trim ?? "";

  useEffect(() => {
    if (!value?.make && !value?.model) return;
    setYear(value.year ?? "");
    setMakeId(value.makeId ? String(value.makeId) : "");
    setMakeName(value.make ?? "");
    setModelKey(value.model ? modelOptionKey(value.modelId ?? 0, value.model) : "");
    setEpaId(value.epaVehicleId ?? "");
    if (value.combMpg) {
      setMpg({
        combMpg: value.combMpg,
        cityMpg: value.cityMpg,
        highwayMpg: value.highwayMpg,
        fuelType: value.fuelType,
        epaVehicleId: value.epaVehicleId,
        optionText: value.trim,
      });
    }
  }, [
    value?.id,
    value?.year,
    value?.make,
    value?.model,
    value?.makeId,
    value?.modelId,
    value?.trim,
    value?.epaVehicleId,
    value?.combMpg,
    value?.cityMpg,
    value?.highwayMpg,
    value?.fuelType,
  ]);

  useEffect(() => {
    apiFetch("/api/vehicles/years")
      .then((r) => r.json())
      .then((data) => setYears(Array.isArray(data) ? data : []))
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    setLoadingMakes(true);
    apiFetch("/api/vehicles/makes")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? (data as VehicleMake[]) : [];
        setMakes([...list].sort((a, b) => a.makeName.localeCompare(b.makeName, "en")));
      })
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
      const res = await apiFetch(
        `/api/vehicles/models?year=${targetYear}&makeId=${targetMakeId}`
      );
      const data = (await res.json()) as VehicleModel[];
      const list = (Array.isArray(data) ? data : []).slice().sort((a, b) =>
        a.modelName.localeCompare(b.modelName, "en")
      );

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

  // Load EPA options when year/make/model ready
  useEffect(() => {
    if (!year || !makeName.trim() || !modelName.trim()) {
      setEpaOptions([]);
      return;
    }

    const requestId = ++optionsRequestRef.current;
    setLoadingOptions(true);

    void (async () => {
      try {
        const params = new URLSearchParams({
          year,
          make: makeName,
          model: modelName,
          options: "1",
        });
        const res = await apiFetch(`/api/vehicles/fuel-economy?${params.toString()}`);
        const data = (await res.json()) as { options?: EpaOption[] };
        if (requestId !== optionsRequestRef.current) return;
        const list = Array.isArray(data.options) ? data.options : [];
        setEpaOptions(list);

        setEpaId((current) => {
          if (current && list.some((o) => o.id === current)) return current;
          // Auto-select single config; otherwise wait for user
          return list.length === 1 ? list[0].id : "";
        });
      } catch {
        if (requestId === optionsRequestRef.current) setEpaOptions([]);
      } finally {
        if (requestId === optionsRequestRef.current) setLoadingOptions(false);
      }
    })();
  }, [year, makeName, modelName]);

  const buildVehicle = useCallback(
    (mpgData?: MpgPayload | null): VehicleInfo | null => {
      if (!year || !makeName.trim() || !modelName.trim()) return null;
      const optionLabel = selectedOptionText || mpgData?.optionText;
      return {
        id: vehicleId,
        year,
        makeId: Number(makeId) || 0,
        make: makeName,
        modelId: Number(modelId) || 0,
        model: modelName,
        trim: optionLabel || undefined,
        displayLabel: formatVehicleLabel(year, makeName, modelName, optionLabel),
        combMpg: mpgData?.combMpg,
        cityMpg: mpgData?.cityMpg,
        highwayMpg: mpgData?.highwayMpg,
        fuelType: mpgData?.fuelType,
        epaVehicleId: mpgData?.epaVehicleId || epaId || undefined,
      };
    },
    [year, makeId, makeName, modelId, modelName, selectedOptionText, vehicleId, epaId]
  );

  useEffect(() => {
    const vehicle = buildVehicle(mpg);
    if (!vehicle) {
      setTips([]);
      return;
    }
    if (showTips) setTips(getVehicleTips(vehicle, locale));
  }, [buildVehicle, showTips, locale, mpg]);

  // Fetch exact EPA MPG when configuration id is known
  useEffect(() => {
    if (!year || !makeName.trim() || !modelName.trim()) {
      setMpg(null);
      return;
    }

    const requestId = ++mpgRequestRef.current;
    setLoadingMpg(true);

    void (async () => {
      try {
        const params = new URLSearchParams({ year, make: makeName, model: modelName });
        if (epaId) params.set("epaId", epaId);
        else if (selectedOptionText) params.set("trim", selectedOptionText);

        const res = await apiFetch(`/api/vehicles/fuel-economy?${params.toString()}`);
        const data = (await res.json()) as MpgPayload;
        if (requestId !== mpgRequestRef.current) return;

        if (!data.combMpg) {
          setMpg(null);
          return;
        }

        const nextMpg: MpgPayload = {
          combMpg: data.combMpg,
          cityMpg: data.cityMpg,
          highwayMpg: data.highwayMpg,
          fuelType: data.fuelType,
          epaVehicleId: data.epaVehicleId || epaId,
          optionText: data.optionText || selectedOptionText,
        };
        setMpg(nextMpg);

        if (
          data.epaVehicleId &&
          !epaId &&
          epaOptions.some((o) => o.id === data.epaVehicleId)
        ) {
          setEpaId(data.epaVehicleId);
        }

        const enriched = buildVehicle(nextMpg);
        if (
          enriched &&
          (!value ||
            value.combMpg !== enriched.combMpg ||
            value.cityMpg !== enriched.cityMpg ||
            value.highwayMpg !== enriched.highwayMpg ||
            value.epaVehicleId !== enriched.epaVehicleId ||
            value.trim !== enriched.trim)
        ) {
          onChange(enriched);
        }
      } catch {
        if (requestId === mpgRequestRef.current) setMpg(null);
      } finally {
        if (requestId === mpgRequestRef.current) setLoadingMpg(false);
      }
    })();
  }, [year, makeName, modelName, epaId, selectedOptionText, buildVehicle, onChange, value, epaOptions]);

  const notifyPartial = useCallback(
    (patch: Partial<VehicleInfo>) => {
      onChange({
        id: vehicleId,
        year: patch.year ?? year,
        makeId: (patch.makeId ?? Number(makeId)) || 0,
        make: patch.make ?? makeName,
        modelId: patch.modelId ?? 0,
        model: patch.model ?? "",
        trim: (patch.trim ?? selectedOptionText) || undefined,
        displayLabel: patch.displayLabel ?? "",
        epaVehicleId: undefined,
        combMpg: undefined,
        cityMpg: undefined,
        highwayMpg: undefined,
        fuelType: undefined,
      });
    },
    [onChange, vehicleId, year, makeId, makeName, selectedOptionText]
  );

  const handleYearChange = (nextYear: string) => {
    setYear(nextYear);
    setModelKey("");
    setModels([]);
    setEpaOptions([]);
    setEpaId("");
    setMpg(null);
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
    setEpaOptions([]);
    setEpaId("");
    setMpg(null);
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
    setEpaOptions([]);
    setEpaId("");
    setMpg(null);
  };

  const handleEpaChange = (id: string) => {
    setEpaId(id);
    setMpg(null);
  };

  const makeSelectValue =
    makeId && makes.some((m) => String(m.makeId) === makeId) ? makeId : undefined;

  const modelSelectValue =
    modelKey && models.some((m) => modelOptionKey(m.modelId, m.modelName) === modelKey)
      ? modelKey
      : undefined;

  const epaSelectValue =
    epaId && epaOptions.some((o) => o.id === epaId) ? epaId : undefined;

  const built = buildVehicle(mpg);
  const gridClass =
    layout === "compact"
      ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      : "grid gap-4 sm:grid-cols-2";

  const isElectric = Boolean(mpg?.fuelType && /electric/i.test(mpg.fuelType));

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
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
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
          <Select
            value={epaSelectValue}
            onValueChange={handleEpaChange}
            disabled={
              loadingOptions || !isCompleteVehicle(built) || epaOptions.length === 0
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue
                placeholder={
                  !isCompleteVehicle(built)
                    ? t("vehicleSelector.selectConfigFirst")
                    : loadingOptions
                      ? t("common.loading")
                      : epaOptions.length
                        ? t("vehicleSelector.selectConfig")
                        : t("vehicleSelector.noConfigs")
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {epaOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {built && layout === "default" && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
          <Car className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium">{built.displayLabel}</span>
        </div>
      )}

      {(loadingMpg || mpg?.combMpg) && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <Fuel className="h-4 w-4 text-primary" />
            {t("vehicleSelector.mpgLabel")}
            {loadingMpg && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          {!loadingMpg && mpg?.combMpg != null && (
            <>
              <p>
                {isElectric
                  ? t("vehicleSelector.mpgElectric", { mpg: mpg.combMpg })
                  : t("vehicleSelector.mpgCombined", { mpg: mpg.combMpg })}
              </p>
              {!isElectric && mpg.cityMpg != null && mpg.highwayMpg != null && (
                <p className="text-xs text-muted-foreground">
                  {t("vehicleSelector.mpgCityHighway", {
                    city: mpg.cityMpg,
                    highway: mpg.highwayMpg,
                  })}
                </p>
              )}
            </>
          )}
          {!loadingMpg && !mpg?.combMpg && isCompleteVehicle(built) && epaId && (
            <p className="text-xs text-amber-700">{t("vehicleSelector.mpgMissing")}</p>
          )}
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
              layout === "compact" ? "grid gap-2 sm:grid-cols-2" : "space-y-2"
            )}
          >
            {tips.slice(0, layout === "compact" ? 2 : 4).map((tip) => (
              <div
                key={tip.id}
                className={cn("rounded-lg border px-3 py-2.5", tipStyles[tip.type])}
              >
                <p className="text-sm font-medium leading-snug">{tip.title}</p>
                <p className="mt-1 text-xs opacity-80 leading-relaxed">{tip.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(loadingMakes || loadingModels || loadingOptions) && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          {loadingOptions ? t("vehicleSelector.mpgLoading") : t("vehicleSelector.catalogLoading")}
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
