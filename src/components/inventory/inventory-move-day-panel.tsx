"use client";

import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { groupBoxesByDestination, InventoryListRow } from "@/components/inventory/inventory-list-row";
import { useT } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InventoryBox, InventoryRoomKey } from "@/lib/inventory/types";

interface InventoryMoveDayPanelProps {
  boxes: InventoryBox[];
  roomLabel: (key: InventoryRoomKey) => string;
  scannedBox: InventoryBox | null;
  onMarkDelivered: (id: string) => void;
  onEdit: (box: InventoryBox) => void;
  onShowQr: (box: InventoryBox) => void;
}

export function InventoryMoveDayPanel({
  boxes,
  roomLabel,
  scannedBox,
  onMarkDelivered,
  onEdit,
  onShowQr,
}: InventoryMoveDayPanelProps) {
  const t = useT();
  const remaining = boxes.filter((b) => b.status !== "delivered").length;
  const groups = useMemo(
    () => groupBoxesByDestination(boxes, roomLabel),
    [boxes, roomLabel]
  );

  if (boxes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">{t("inventory.emptyDesc")}</p>
    );
  }

  if (remaining === 0) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="font-semibold">{t("inventory.moveDayAllDone")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("inventory.moveDayDesc")}{" "}
        <span className="font-medium text-foreground">
          {t("inventory.moveDayRemaining", { count: remaining })}
        </span>
      </p>

      {scannedBox && scannedBox.status !== "delivered" && (
        <Card className="border-primary shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("inventory.scannedBox")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-semibold">{t("inventory.boxLabel", { n: scannedBox.boxNumber })}</p>
            <p className="text-sm">{scannedBox.contents}</p>
            <p className="text-sm text-primary">
              {t("inventory.destinationShort", {
                room: roomLabel(scannedBox.destinationRoom ?? scannedBox.room),
              })}
            </p>
            <Button className="w-full" onClick={() => onMarkDelivered(scannedBox.id)}>
              {t("inventory.markDelivered")}
            </Button>
          </CardContent>
        </Card>
      )}

      {groups.map((group) => (
        <div key={group.room} className="space-y-2">
          <h4 className="font-semibold text-sm">{group.roomLabel}</h4>
          <div className="space-y-2">
            {group.boxes.map((box) => (
              <InventoryListRow
                key={box.id}
                box={box}
                roomLabel={roomLabel(box.room)}
                destLabel={roomLabel(box.destinationRoom ?? box.room)}
                selected={false}
                onSelect={() => {}}
                onEdit={() => onEdit(box)}
                onShowQr={() => onShowQr(box)}
                onStatusChange={() => onMarkDelivered(box.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
