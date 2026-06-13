"use client";

import { useEffect, useState } from "react";
import { useT } from "@/contexts/locale-context";
import { generateBoxQrDataUrl } from "@/lib/inventory/qr";
import type { InventoryBox, InventoryRoomKey } from "@/lib/inventory/types";

interface InventoryLabelsPrintProps {
  boxes: InventoryBox[];
  roomLabel: (key: InventoryRoomKey) => string;
  active: boolean;
  onDone: () => void;
}

export function InventoryLabelsPrint({
  boxes,
  roomLabel,
  active,
  onDone,
}: InventoryLabelsPrintProps) {
  const t = useT();
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!active || boxes.length === 0) return;
    let cancelled = false;
    async function load() {
      const entries = await Promise.all(
        boxes.map(async (b) => {
          try {
            const url = await generateBoxQrDataUrl(b.boxNumber, b.id);
            return [b.id, url] as const;
          } catch {
            return [b.id, ""] as const;
          }
        })
      );
      if (!cancelled) {
        setQrs(Object.fromEntries(entries));
        requestAnimationFrame(() => {
          window.print();
          onDone();
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [active, boxes, onDone]);

  if (!active) return null;

  return (
    <div id="inventory-labels-print" className="hidden print:block">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #inventory-labels-print, #inventory-labels-print * { visibility: visible; }
          #inventory-labels-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <div className="grid grid-cols-2 gap-4 p-4">
        {boxes.map((box) => (
          <div
            key={box.id}
            className="flex items-center gap-3 rounded border border-gray-300 p-3 break-inside-avoid"
          >
            {qrs[box.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrs[box.id]} alt="" width={80} height={80} className="shrink-0" />
            ) : (
              <div className="h-20 w-20 bg-gray-100 shrink-0" />
            )}
            <div className="min-w-0 text-xs">
              <p className="text-lg font-bold">#{box.boxNumber}</p>
              <p className="font-medium">{roomLabel(box.room)}</p>
              <p className="text-gray-600">→ {roomLabel(box.destinationRoom ?? box.room)}</p>
              <p className="line-clamp-2 mt-1">{box.contents}</p>
              <div className="flex gap-2 mt-1 font-semibold">
                {box.fragile && <span>{t("inventory.fragileBadge")}</span>}
                {box.essentials && <span>{t("inventory.essentialsBadge")}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
