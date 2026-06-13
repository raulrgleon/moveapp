"use client";

import Link from "next/link";
import { useT } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { totalEstimatedWeightLbs } from "@/lib/inventory/load-order";
import type { InventoryBox } from "@/lib/inventory/types";

interface InventoryWeightSummaryProps {
  boxes: InventoryBox[];
}

export function InventoryWeightSummary({ boxes }: InventoryWeightSummaryProps) {
  const t = useT();
  if (boxes.length === 0) return null;

  const weight = Math.round(totalEstimatedWeightLbs(boxes));
  const heavy = weight > 2000;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("inventory.weightSummary")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-bold">{weight} lbs</p>
        <p className="text-sm text-muted-foreground">
          {t("inventory.weightSummaryDesc", { weight, count: boxes.length })}
        </p>
        {heavy && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t("inventory.weightHeavyHint")}{" "}
            <Link href="/trucks" className="underline">
              Trucks
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
