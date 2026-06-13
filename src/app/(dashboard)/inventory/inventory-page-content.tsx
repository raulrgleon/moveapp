"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Download,
  LayoutGrid,
  List,
  Package,
  Plus,
  Printer,
  Search,
  Sparkles,
} from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { InventoryBoxCard } from "@/components/inventory/inventory-box-card";
import { InventoryBoxForm } from "@/components/inventory/inventory-box-form";
import { InventoryBulkBar } from "@/components/inventory/inventory-bulk-bar";
import { InventoryLabelsPrint } from "@/components/inventory/inventory-labels-print";
import { InventoryListRow } from "@/components/inventory/inventory-list-row";
import { InventoryLoadOrderCard } from "@/components/inventory/inventory-load-order-card";
import { InventoryMoveDayPanel } from "@/components/inventory/inventory-move-day-panel";
import { InventoryPilotPanel } from "@/components/inventory/inventory-pilot-panel";
import { InventoryQrDialog } from "@/components/inventory/inventory-qr-dialog";
import { InventoryRoomProgress } from "@/components/inventory/inventory-room-progress";
import { InventoryWeightSummary } from "@/components/inventory/inventory-weight-summary";
import { useInventory } from "@/contexts/inventory-context";
import { useT } from "@/contexts/locale-context";
import { INVENTORY_TEMPLATES } from "@/lib/inventory/templates";
import { originRoomProgress, destinationRoomProgress, inventoryStats } from "@/lib/inventory/room-progress";
import {
  INVENTORY_ROOM_KEYS,
  type InventoryBox,
  type InventoryRoomKey,
  type InventorySortKey,
  type InventoryViewMode,
} from "@/lib/inventory/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FormMode = { type: "add" } | { type: "edit"; box: InventoryBox };

const VIEW_KEY = "movepilot_inventory_view";

export function InventoryPageContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const {
    boxes,
    isHydrated,
    addBox,
    addBoxes,
    updateBox,
    removeBox,
    removeBoxes,
    setBoxStatus,
    bulkSetStatus,
    getBoxByNumber,
  } = useInventory();

  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState<InventoryRoomKey | "all">("all");
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [qrBox, setQrBox] = useState<InventoryBox | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<InventoryViewMode>("grid");
  const [sortKey, setSortKey] = useState<InventorySortKey>("boxNumber");
  const [printLabels, setPrintLabels] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [tab, setTab] = useState("manage");

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_KEY);
    if (stored === "grid" || stored === "list") setViewMode(stored);
  }, []);

  const roomLabel = useCallback(
    (key: InventoryRoomKey) => t(`inventory.rooms.${key}`),
    [t]
  );

  const scannedBox = useMemo(() => {
    const boxParam = searchParams.get("box");
    if (!boxParam) return null;
    const num = Number(boxParam);
    return Number.isFinite(num) ? getBoxByNumber(num) : null;
  }, [searchParams, getBoxByNumber]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = [...boxes]
      .filter((box) => roomFilter === "all" || box.room === roomFilter)
      .filter((box) => {
        if (!q) return true;
        const dest = box.destinationRoom ?? box.room;
        return (
          String(box.boxNumber).includes(q) ||
          roomLabel(box.room).toLowerCase().includes(q) ||
          roomLabel(dest).toLowerCase().includes(q) ||
          box.contents.toLowerCase().includes(q)
        );
      });

    list.sort((a, b) => {
      if (sortKey === "boxNumber") return a.boxNumber - b.boxNumber;
      if (sortKey === "room") return roomLabel(a.room).localeCompare(roomLabel(b.room));
      if (sortKey === "status") return a.status.localeCompare(b.status);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [boxes, search, roomFilter, roomLabel, sortKey]);

  const stats = useMemo(() => inventoryStats(boxes), [boxes]);
  const originProgress = useMemo(() => originRoomProgress(boxes), [boxes]);
  const destProgress = useMemo(() => destinationRoomProgress(boxes), [boxes]);

  useEffect(() => {
    if (!isHydrated) return;
    if (scannedBox) {
      setHighlightId(scannedBox.id);
      setTab("moveDay");
      setQrBox(scannedBox);
      const timer = setTimeout(() => setHighlightId(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, scannedBox]);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filtered.map((b) => b.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const closeForm = () => setFormMode(null);

  return (
    <>
      <DashboardHeader title={t("inventory.title")} description={t("inventory.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("inventory.pageTitle")}
          description={t("inventory.pageDesc", { count: boxes.length })}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/api/inventory/export.csv" download="inventory.csv">
                  <Download className="mr-2 h-4 w-4" />
                  {t("inventory.exportCsv")}
                </a>
              </Button>
              <Button
                variant="outline"
                disabled={boxes.length === 0}
                onClick={() => setPrintLabels(true)}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t("inventory.printAllLabels")}
              </Button>
              <Button variant="outline" onClick={() => setTemplatesOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                {t("inventory.templates")}
              </Button>
              <Button onClick={() => setFormMode({ type: "add" })}>
                <Plus className="mr-2 h-4 w-4" />
                {t("inventory.addBox")}
              </Button>
            </div>
          }
        />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="manage">{t("inventory.tabManage")}</TabsTrigger>
            <TabsTrigger value="moveDay">{t("inventory.tabMoveDay")}</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-6 mt-6">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t("inventory.statusSummary")}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {t("inventory.statuses.packed")}: {stats.stillPacked}
                    </Badge>
                    <Badge className="text-[10px]">
                      {t("inventory.statuses.in_transit")}: {stats.inTransit}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {t("inventory.statuses.delivered")}: {stats.delivered}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <InventoryWeightSummary boxes={boxes} />
              <Card className="border-dashed">
                <CardContent className="flex h-full items-center justify-center p-4">
                  <p className="text-xs text-center text-muted-foreground">{t("inventory.qrHint")}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <InventoryRoomProgress
                title={t("inventory.originProgress")}
                rows={originProgress}
                roomLabel={roomLabel}
              />
              <InventoryRoomProgress
                title={t("inventory.destinationProgress")}
                rows={destProgress}
                roomLabel={roomLabel}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <InventoryLoadOrderCard boxes={boxes} />
              <InventoryPilotPanel />
            </div>

            <InventoryBulkBar
              count={selectedIds.size}
              onMarkTransit={() => {
                bulkSetStatus(Array.from(selectedIds), "in_transit");
                clearSelection();
              }}
              onMarkDelivered={() => {
                bulkSetStatus(Array.from(selectedIds), "delivered");
                clearSelection();
              }}
              onDelete={() => {
                removeBoxes(Array.from(selectedIds));
                clearSelection();
              }}
              onClear={clearSelection}
            />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("inventory.searchPlaceholder")}
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as InventorySortKey)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder={t("inventory.sortBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boxNumber">{t("inventory.sortBoxNumber")}</SelectItem>
                    <SelectItem value="room">{t("inventory.sortRoom")}</SelectItem>
                    <SelectItem value="status">{t("inventory.sortStatus")}</SelectItem>
                    <SelectItem value="updated">{t("inventory.sortUpdated")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "outline"}
                  onClick={() => {
                    setViewMode("grid");
                    localStorage.setItem(VIEW_KEY, "grid");
                  }}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "outline"}
                  onClick={() => {
                    setViewMode("list");
                    localStorage.setItem(VIEW_KEY, "list");
                  }}
                >
                  <List className="h-4 w-4" />
                </Button>
                {filtered.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={selectAll}>
                    {t("inventory.selectAll")}
                  </Button>
                )}
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
              <div className="py-16 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed py-16 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-medium">
                  {boxes.length === 0 ? t("inventory.emptyTitle") : t("inventory.noResults")}
                </p>
                {boxes.length === 0 && (
                  <Button className="mt-4" onClick={() => setFormMode({ type: "add" })}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("inventory.addBox")}
                  </Button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((box) => (
                  <InventoryBoxCard
                    key={box.id}
                    box={box}
                    roomLabel={roomLabel(box.room)}
                    destLabel={roomLabel(box.destinationRoom ?? box.room)}
                    highlighted={highlightId === box.id}
                    selected={selectedIds.has(box.id)}
                    onSelect={(c) => toggleSelect(box.id, c)}
                    onEdit={() => setFormMode({ type: "edit", box })}
                    onDelete={() => removeBox(box.id)}
                    onShowQr={() => setQrBox(box)}
                    onStatusChange={(status) => setBoxStatus(box.id, status)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((box) => (
                  <InventoryListRow
                    key={box.id}
                    box={box}
                    roomLabel={roomLabel(box.room)}
                    destLabel={roomLabel(box.destinationRoom ?? box.room)}
                    selected={selectedIds.has(box.id)}
                    onSelect={(c) => toggleSelect(box.id, c)}
                    onEdit={() => setFormMode({ type: "edit", box })}
                    onShowQr={() => setQrBox(box)}
                    onStatusChange={(status) => setBoxStatus(box.id, status)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="moveDay" className="mt-6">
            <InventoryMoveDayPanel
              boxes={boxes}
              roomLabel={roomLabel}
              scannedBox={scannedBox ?? null}
              onMarkDelivered={(id) => setBoxStatus(id, "delivered")}
              onEdit={(box) => setFormMode({ type: "edit", box })}
              onShowQr={setQrBox}
            />
          </TabsContent>
        </Tabs>
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

      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inventory.templates")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("inventory.templatesDesc")}</p>
          <div className="space-y-2 pt-2">
            {INVENTORY_TEMPLATES.map((tpl) => (
              <Button
                key={tpl.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  addBoxes(tpl.boxes);
                  setTemplatesOpen(false);
                }}
              >
                {t(tpl.labelKey)} ({tpl.boxes.length})
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <InventoryQrDialog
        box={qrBox}
        roomLabel={qrBox ? roomLabel(qrBox.destinationRoom ?? qrBox.room) : ""}
        open={qrBox !== null}
        onOpenChange={(open) => !open && setQrBox(null)}
      />

      <InventoryLabelsPrint
        boxes={boxes}
        roomLabel={roomLabel}
        active={printLabels}
        onDone={() => setPrintLabels(false)}
      />
    </>
  );
}
