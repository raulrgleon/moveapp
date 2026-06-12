"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Package, Plus, Search } from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { InventoryBoxCard } from "@/components/inventory/inventory-box-card";
import { InventoryBoxForm } from "@/components/inventory/inventory-box-form";
import { InventoryQrDialog } from "@/components/inventory/inventory-qr-dialog";
import { useInventory } from "@/contexts/inventory-context";
import { useT } from "@/contexts/locale-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { INVENTORY_ROOM_KEYS, type InventoryBox, type InventoryRoomKey } from "@/lib/inventory/types";
import { cn } from "@/lib/utils";

type FormMode = { type: "add" } | { type: "edit"; box: InventoryBox };

export function InventoryPageContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const {
    boxes,
    isHydrated,
    addBox,
    updateBox,
    removeBox,
    setBoxStatus,
    getBoxByNumber,
  } = useInventory();

  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState<InventoryRoomKey | "all">("all");
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [qrBox, setQrBox] = useState<InventoryBox | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const roomLabel = useCallback(
    (key: InventoryRoomKey) => t(`inventory.rooms.${key}`),
    [t]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return [...boxes]
      .filter((box) => roomFilter === "all" || box.room === roomFilter)
      .filter((box) => {
        if (!q) return true;
        return (
          String(box.boxNumber).includes(q) ||
          roomLabel(box.room).toLowerCase().includes(q) ||
          box.contents.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.boxNumber - b.boxNumber);
  }, [boxes, search, roomFilter, roomLabel]);

  const statusCounts = useMemo(() => {
    return boxes.reduce(
      (acc, box) => {
        acc[box.status] += 1;
        return acc;
      },
      { packed: 0, in_transit: 0, delivered: 0 }
    );
  }, [boxes]);

  useEffect(() => {
    if (!isHydrated) return;
    const boxParam = searchParams.get("box");
    if (!boxParam) return;
    const num = Number(boxParam);
    if (!Number.isFinite(num)) return;
    const match = getBoxByNumber(num);
    if (match) {
      setHighlightId(match.id);
      setQrBox(match);
      const timer = setTimeout(() => setHighlightId(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, searchParams, getBoxByNumber]);

  const closeForm = () => setFormMode(null);

  return (
    <>
      <DashboardHeader
        title={t("inventory.title")}
        description={t("inventory.subtitle")}
      />
      <PageContainer>
        <PageHeader
          title={t("inventory.pageTitle")}
          description={t("inventory.pageDesc", { count: boxes.length })}
          action={
            <Button onClick={() => setFormMode({ type: "add" })}>
              <Plus className="mr-2 h-4 w-4" />
              {t("inventory.addBox")}
            </Button>
          }
        />

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t("inventory.totalBoxes")}</p>
                <p className="text-xl font-bold">{boxes.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("inventory.statusSummary")}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {t("inventory.statuses.packed")}: {statusCounts.packed}
                  </Badge>
                  <Badge className="text-[10px]">
                    {t("inventory.statuses.in_transit")}: {statusCounts.in_transit}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {t("inventory.statuses.delivered")}: {statusCounts.delivered}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="flex h-full items-center justify-center p-4">
              <p className="text-xs text-center text-muted-foreground">{t("inventory.qrHint")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("inventory.searchPlaceholder")}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setRoomFilter("all")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              roomFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {t("inventory.allRooms")}
          </button>
          {INVENTORY_ROOM_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRoomFilter(key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                roomFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`inventory.rooms.${key}`)}
            </button>
          ))}
        </div>

        {!isHydrated ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium">
              {boxes.length === 0 ? t("inventory.emptyTitle") : t("inventory.noResults")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {boxes.length === 0 ? t("inventory.emptyDesc") : t("inventory.searchPlaceholder")}
            </p>
            {boxes.length === 0 && (
              <Button className="mt-4" onClick={() => setFormMode({ type: "add" })}>
                <Plus className="mr-2 h-4 w-4" />
                {t("inventory.addBox")}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((box) => (
              <InventoryBoxCard
                key={box.id}
                box={box}
                roomLabel={roomLabel(box.room)}
                highlighted={highlightId === box.id}
                onEdit={() => setFormMode({ type: "edit", box })}
                onDelete={() => removeBox(box.id)}
                onShowQr={() => setQrBox(box)}
                onStatusChange={(status) => setBoxStatus(box.id, status)}
              />
            ))}
          </div>
        )}
      </PageContainer>

      <Dialog open={formMode !== null} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formMode?.type === "edit"
                ? t("inventory.editBoxTitle", { n: formMode.box.boxNumber })
                : t("inventory.newBoxTitle")}
            </DialogTitle>
          </DialogHeader>
          {formMode && (
            <InventoryBoxForm
              initial={formMode.type === "edit" ? formMode.box : undefined}
              onCancel={closeForm}
              onSubmit={(input) => {
                if (formMode.type === "edit") {
                  updateBox(formMode.box.id, input);
                } else {
                  addBox(input);
                }
                closeForm();
              }}
              onDelete={
                formMode.type === "edit"
                  ? () => {
                      removeBox(formMode.box.id);
                      closeForm();
                    }
                  : undefined
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <InventoryQrDialog
        box={qrBox}
        roomLabel={qrBox ? roomLabel(qrBox.room) : ""}
        open={qrBox !== null}
        onOpenChange={(open) => !open && setQrBox(null)}
      />
    </>
  );
}
