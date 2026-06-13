"use client";

import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";

interface InventoryBulkBarProps {
  count: number;
  onMarkTransit: () => void;
  onMarkDelivered: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function InventoryBulkBar({
  count,
  onMarkTransit,
  onMarkDelivered,
  onDelete,
  onClear,
}: InventoryBulkBarProps) {
  const t = useT();
  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-sm">
      <span className="text-sm font-medium mr-auto">
        {t("inventory.selected", { count })}
      </span>
      <Button size="sm" variant="outline" onClick={onMarkTransit}>
        {t("inventory.bulkMarkTransit")}
      </Button>
      <Button size="sm" variant="outline" onClick={onMarkDelivered}>
        {t("inventory.bulkMarkDelivered")}
      </Button>
      <Button size="sm" variant="destructive" onClick={onDelete}>
        {t("inventory.bulkDelete")}
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        {t("inventory.clearSelection")}
      </Button>
    </div>
  );
}
