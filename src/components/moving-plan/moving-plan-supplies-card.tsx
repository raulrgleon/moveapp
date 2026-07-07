"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { useMovingSupplies } from "@/hooks/use-moving-supplies";
import { suppliesProgress } from "@/lib/inventory/supplies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function MovingPlanSuppliesCard() {
  const t = useT();
  const { profile } = useMove();
  const { checked, isHydrated } = useMovingSupplies();
  const progress = suppliesProgress(checked);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          {t("movingSupplies.planCardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("movingSupplies.planCardDesc")}</p>
        {isHydrated && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("movingSupplies.progress")}</span>
              <span>
                {t("movingSupplies.progressCount", {
                  done: progress.done,
                  total: progress.total,
                })}
              </span>
            </div>
            <Progress value={progress.percent} className="h-1.5" />
          </div>
        )}
        <Button asChild size="sm" className="w-full">
          <Link href="/inventory?tab=supplies">{t("movingSupplies.openList")}</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/shopping-list">{t("movingSupplies.shoppingListLinkAction")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
