"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { useInventory } from "@/contexts/inventory-context";
import { useT } from "@/contexts/locale-context";
import { inventoryStats } from "@/lib/inventory/room-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function DashboardInventoryCard() {
  const t = useT();
  const { boxes, isHydrated } = useInventory();

  if (!isHydrated || boxes.length === 0) return null;

  const stats = inventoryStats(boxes);
  const deliveredPct = stats.total
    ? Math.round((stats.delivered / stats.total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          {t("inventory.dashboardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("inventory.dashboardDesc", {
            total: stats.total,
            delivered: stats.delivered,
          })}
        </p>
        <Progress value={deliveredPct} className="h-2" />
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {stats.withoutPhoto > 0 && (
            <span>{t("inventory.dashboardNoPhoto", { count: stats.withoutPhoto })}</span>
          )}
          {stats.stillPacked > 0 && (
            <span>{t("inventory.dashboardPacked", { count: stats.stillPacked })}</span>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/inventory">{t("inventory.openInventory")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
