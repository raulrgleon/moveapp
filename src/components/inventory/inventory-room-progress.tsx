"use client";

import { useT } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { RoomProgressRow } from "@/lib/inventory/room-progress";
import type { InventoryRoomKey } from "@/lib/inventory/types";

interface InventoryRoomProgressProps {
  title: string;
  rows: RoomProgressRow[];
  roomLabel: (key: InventoryRoomKey) => string;
}

export function InventoryRoomProgress({ title, rows, roomLabel }: InventoryRoomProgressProps) {
  const t = useT();
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.room}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{roomLabel(row.room)}</span>
              <span className="text-muted-foreground">
                {t("inventory.progressMoved", {
                  moved: row.inTransit + row.delivered,
                  total: row.total,
                })}
              </span>
            </div>
            <Progress value={row.percent} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
