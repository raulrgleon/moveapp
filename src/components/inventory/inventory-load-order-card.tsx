"use client";

import { useT } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sortBoxesForLoadOrder } from "@/lib/inventory/load-order";
import type { InventoryBox } from "@/lib/inventory/types";

interface InventoryLoadOrderCardProps {
  boxes: InventoryBox[];
}

export function InventoryLoadOrderCard({ boxes }: InventoryLoadOrderCardProps) {
  const t = useT();
  const ordered = sortBoxesForLoadOrder(boxes).slice(0, 12);
  if (ordered.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("inventory.loadOrder")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("inventory.loadOrderDesc")}</p>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 text-sm">
          {ordered.map((box, i) => (
            <li key={box.id} className="flex gap-2">
              <span className="text-muted-foreground shrink-0 w-16">
                {t("inventory.loadStep", { n: i + 1 })}
              </span>
              <span>
                <strong>{t("inventory.boxLabel", { n: box.boxNumber })}</strong>
                {" — "}
                {box.contents.slice(0, 60)}
                {box.contents.length > 60 ? "…" : ""}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
