"use client";

import { effectiveDestinationRoom, type InventoryBox, type InventoryBoxStatus } from "@/lib/inventory/types";
import { useT } from "@/contexts/locale-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface InventoryListRowProps {
  box: InventoryBox;
  roomLabel: string;
  destLabel: string;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onShowQr: () => void;
  onStatusChange: (status: InventoryBoxStatus) => void;
}

export function InventoryListRow({
  box,
  roomLabel,
  destLabel,
  selected,
  onSelect,
  onEdit,
  onShowQr,
  onStatusChange,
}: InventoryListRowProps) {
  const t = useT();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3 bg-card hover:bg-muted/30 transition-colors",
        selected && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
      <Checkbox checked={selected} onCheckedChange={(v) => onSelect(v === true)} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm">{t("inventory.boxLabel", { n: box.boxNumber })}</span>
          <Badge variant="outline" className="text-[10px]">
            {t(`inventory.statuses.${box.status}`)}
          </Badge>
          {box.fragile && (
            <Badge className="text-[10px] bg-amber-500">{t("inventory.fragileBadge")}</Badge>
          )}
          {box.essentials && (
            <Badge className="text-[10px] bg-primary">{t("inventory.essentialsBadge")}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {roomLabel} · {t("inventory.destinationShort", { room: destLabel })}
        </p>
        <p className="text-sm line-clamp-2 sm:line-clamp-1 mt-1 break-words">{box.contents}</p>
      </div>
      </div>
      <div className="flex flex-wrap shrink-0 gap-1 pl-8 sm:pl-0 w-full sm:w-auto">
        {box.status !== "delivered" && (
          <Button size="sm" variant="outline" className="h-8 text-xs flex-1 sm:flex-none" onClick={() => onStatusChange("delivered")}>
            {t("inventory.markDelivered")}
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8" onClick={onShowQr}>
          QR
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={onEdit}>
          {t("inventory.editBox")}
        </Button>
      </div>
    </div>
  );
}

export function groupBoxesByDestination(
  boxes: InventoryBox[],
  roomLabel: (room: InventoryBox["room"]) => string
) {
  const pending = boxes.filter((b) => b.status !== "delivered");
  const groups = new Map<string, InventoryBox[]>();
  for (const box of pending) {
    const key = effectiveDestinationRoom(box);
    const list = groups.get(key) ?? [];
    list.push(box);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([room, items]) => ({
    room: room as InventoryBox["room"],
    roomLabel: roomLabel(room as InventoryBox["room"]),
    boxes: items.sort((a, b) => a.boxNumber - b.boxNumber),
  }));
}
