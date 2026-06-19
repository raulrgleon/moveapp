"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Printer, RotateCcw } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import { useMovingSupplies } from "@/hooks/use-moving-supplies";
import {
  SUPPLY_CATEGORIES,
  SUPPLY_ITEMS,
  getSupplyQuantity,
  parseHousehold,
  suppliesProgress,
} from "@/lib/inventory/supplies";
import { householdWithPets } from "@/lib/move-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { InventorySuppliesPrint } from "@/components/inventory/inventory-supplies-print";

export function InventorySuppliesPanel() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useMove();
  const { checked, toggle, reset, isHydrated } = useMovingSupplies();
  const [printing, setPrinting] = useState(false);

  const household = useMemo(
    () => parseHousehold(householdWithPets(profile)),
    [profile]
  );

  const progress = useMemo(() => suppliesProgress(checked), [checked]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, typeof SUPPLY_ITEMS>();
    for (const cat of SUPPLY_CATEGORIES) {
      map.set(cat, SUPPLY_ITEMS.filter((item) => item.category === cat));
    }
    return map;
  }, []);

  const printRows = useMemo(
    () =>
      SUPPLY_ITEMS.map((item) => ({
        id: item.id,
        label: t(`movingSupplies.items.${item.id}`),
        qty: getSupplyQuantity(item, household),
        unit: t(`movingSupplies.units.${item.id}`),
        checked: !!checked[item.id],
        category: t(`movingSupplies.categories.${item.category}`),
      })),
    [t, household, checked]
  );

  if (!isHydrated) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium">{t("movingSupplies.introTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("movingSupplies.introDesc", {
                    household: householdWithPets(profile) || t("movingSupplies.defaultHousehold"),
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("movingSupplies.budgetHint")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setPrinting(true)}>
                  <Printer className="mr-2 h-4 w-4" />
                  {t("movingSupplies.printList")}
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t("movingSupplies.resetChecks")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("movingSupplies.progress")}</span>
                <span className="font-medium">
                  {t("movingSupplies.progressCount", {
                    done: progress.done,
                    total: progress.total,
                  })}
                </span>
              </div>
              <Progress value={progress.percent} className="h-2" />
              {progress.percent === 100 && (
                <p className="flex items-center gap-1.5 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("movingSupplies.allReady")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {SUPPLY_CATEGORIES.map((category) => {
            const items = itemsByCategory.get(category) ?? [];
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t(`movingSupplies.categories.${category}`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => {
                    const qty = getSupplyQuantity(item, household);
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/5"
                      >
                        <Checkbox
                          checked={!!checked[item.id]}
                          onCheckedChange={(v) => toggle(item.id, v === true)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">
                            {t(`movingSupplies.items.${item.id}`)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("movingSupplies.suggestedQty", {
                              qty,
                              unit: t(`movingSupplies.units.${item.id}`),
                            })}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            {t("movingSupplies.checklistLink")}{" "}
            <Link href="/checklist?category=Packing" className="text-primary underline-offset-4 hover:underline">
              {t("movingSupplies.checklistLinkAction")}
            </Link>
          </CardContent>
        </Card>
      </div>

      <InventorySuppliesPrint
        active={printing}
        onDone={() => setPrinting(false)}
        title={t("movingSupplies.printTitle")}
        household={householdWithPets(profile) || t("movingSupplies.defaultHousehold")}
        locale={locale}
        rows={printRows}
      />
    </>
  );
}
