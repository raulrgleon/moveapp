"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateBoxQrDataUrl } from "@/lib/inventory/qr";
import type { InventoryBox } from "@/lib/inventory/types";

interface InventoryQrDialogProps {
  box: InventoryBox | null;
  roomLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryQrDialog({
  box,
  roomLabel,
  open,
  onOpenChange,
}: InventoryQrDialogProps) {
  const t = useT();
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!box || !open) {
      setQrUrl(null);
      return;
    }
    generateBoxQrDataUrl(box.boxNumber, box.id).then(setQrUrl).catch(() => setQrUrl(null));
  }, [box, open]);

  const handleDownload = () => {
    if (!qrUrl || !box) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `movepilot-box-${box.boxNumber}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {box ? t("inventory.qrTitle", { n: box.boxNumber }) : t("inventory.qrTitleGeneric")}
          </DialogTitle>
          <DialogDescription>
            {t("inventory.qrDesc")}
          </DialogDescription>
        </DialogHeader>

        {box && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="" width={200} height={200} className="h-[200px] w-[200px]" />
              ) : (
                <div className="h-[200px] w-[200px] animate-pulse rounded bg-muted" />
              )}
            </div>
            <div className="text-center text-sm">
              <p className="font-semibold">{t("inventory.boxLabel", { n: box.boxNumber })}</p>
              <p className="text-primary">{roomLabel}</p>
              <p className="text-muted-foreground mt-1 line-clamp-2">{box.contents}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleDownload} disabled={!qrUrl}>
              <Download className="h-4 w-4 mr-2" />
              {t("inventory.downloadQr")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
