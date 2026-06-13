"use client";

import { useEffect, useState } from "react";
import { Camera, MoreHorizontal, Pencil, QrCode, Trash2 } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateBoxQrDataUrl } from "@/lib/inventory/qr";
import type { InventoryBox, InventoryBoxStatus } from "@/lib/inventory/types";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<InventoryBoxStatus, "secondary" | "default" | "outline"> = {
  packed: "secondary",
  in_transit: "default",
  delivered: "outline",
};

interface InventoryBoxCardProps {
  box: InventoryBox;
  roomLabel: string;
  destLabel: string;
  highlighted?: boolean;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onShowQr: () => void;
  onStatusChange: (status: InventoryBoxStatus) => void;
}

export function InventoryBoxCard({
  box,
  roomLabel,
  destLabel,
  highlighted,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onShowQr,
  onStatusChange,
}: InventoryBoxCardProps) {
  const t = useT();
  const [thumbQr, setThumbQr] = useState<string | null>(null);

  useEffect(() => {
    generateBoxQrDataUrl(box.boxNumber, box.id)
      .then(setThumbQr)
      .catch(() => setThumbQr(null));
  }, [box.boxNumber, box.id]);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-md",
        highlighted && "ring-2 ring-primary shadow-md",
        selected && "ring-2 ring-primary/50"
      )}
    >
      <div className="relative flex h-28 items-center justify-center border-b bg-muted/40">
        {onSelect && (
          <div className="absolute left-2 top-2 z-10">
            <Checkbox
              checked={selected}
              onCheckedChange={(v) => onSelect(v === true)}
              className="bg-background border-2"
            />
          </div>
        )}
        {box.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={box.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Camera className="h-7 w-7 opacity-40" />
            <span className="text-[10px]">{t("inventory.noPhoto")}</span>
          </div>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          {box.fragile && (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-[10px]">
              {t("inventory.fragileBadge")}
            </Badge>
          )}
          {box.essentials && (
            <Badge className="bg-primary text-[10px]">{t("inventory.essentialsBadge")}</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{t("inventory.boxLabel", { n: box.boxNumber })}</p>
              <Badge variant={STATUS_VARIANT[box.status]} className="text-[10px]">
                {t(`inventory.statuses.${box.status}`)}
              </Badge>
            </div>
            <p className="text-sm text-primary truncate">{roomLabel}</p>
            <p className="text-xs text-muted-foreground truncate">
              {t("inventory.destinationShort", { room: destLabel })}
            </p>
            {box.assigneeEmail && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{box.assigneeEmail}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onShowQr}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-background hover:bg-muted/60 transition-colors"
            title={t("inventory.viewQr")}
          >
            {thumbQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbQr} alt="" className="h-9 w-9 rounded" />
            ) : (
              <QrCode className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{box.contents}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {(["packed", "in_transit", "delivered"] as InventoryBoxStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(s)}
                className={cn(
                  "h-2 w-2 rounded-full transition-transform",
                  box.status === s ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                title={t(`inventory.statuses.${s}`)}
              />
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("inventory.editBox")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShowQr}>
                <QrCode className="h-4 w-4 mr-2" />
                {t("inventory.viewQr")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t("inventory.deleteBox")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
