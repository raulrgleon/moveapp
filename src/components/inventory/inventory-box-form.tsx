"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { useMoveTeam } from "@/hooks/use-move-team";
import { apiFetchForm } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INVENTORY_ROOM_KEYS,
  INVENTORY_SIZE_KEYS,
  MAX_PHOTO_BYTES,
  type InventoryBox,
  type InventoryBoxInput,
  type InventoryBoxStatus,
  type InventoryRoomKey,
  type InventorySizeEstimate,
} from "@/lib/inventory/types";

interface InventoryBoxFormProps {
  initial?: InventoryBox;
  onSubmit: (input: InventoryBoxInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const STATUS_KEYS: InventoryBoxStatus[] = ["packed", "in_transit", "delivered"];

export function InventoryBoxForm({
  initial,
  onSubmit,
  onCancel,
  onDelete,
}: InventoryBoxFormProps) {
  const t = useT();
  const { assigneeOptions } = useMoveTeam();
  const fileRef = useRef<HTMLInputElement>(null);
  const [room, setRoom] = useState<InventoryRoomKey>(initial?.room ?? "kitchen");
  const [destinationRoom, setDestinationRoom] = useState<InventoryRoomKey>(
    initial?.destinationRoom ?? initial?.room ?? "kitchen"
  );
  const [contents, setContents] = useState(initial?.contents ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initial?.photoUrl);
  const [fragile, setFragile] = useState(initial?.fragile ?? false);
  const [essentials, setEssentials] = useState(initial?.essentials ?? false);
  const [sizeEstimate, setSizeEstimate] = useState<InventorySizeEstimate>(
    initial?.sizeEstimate ?? "m"
  );
  const [weightLbs, setWeightLbs] = useState(
    initial?.weightLbs != null ? String(initial.weightLbs) : ""
  );
  const [assigneeEmail, setAssigneeEmail] = useState(initial?.assigneeEmail ?? "");
  const [status, setStatus] = useState<InventoryBoxStatus>(initial?.status ?? "packed");
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhoto = async (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError(t("inventory.photoTypeError"));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t("inventory.photoSizeError"));
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetchForm("/api/inventory/photo", form);
      const data = (await res.json()) as { photoUrl: string };
      setPhotoUrl(data.photoUrl);
      return;
    } catch {
      /* fallback to local preview */
    }

    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contents.trim()) return;
    const parsedWeight = weightLbs.trim() ? Number(weightLbs) : undefined;
    onSubmit({
      room,
      destinationRoom: destinationRoom !== room ? destinationRoom : destinationRoom,
      contents,
      photoUrl,
      fragile,
      essentials,
      sizeEstimate,
      weightLbs: parsedWeight && parsedWeight > 0 ? parsedWeight : undefined,
      assigneeEmail: assigneeEmail || undefined,
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("inventory.room")}</Label>
          <Select
            value={room}
            onValueChange={(v) => {
              const r = v as InventoryRoomKey;
              setRoom(r);
              if (!initial) setDestinationRoom(r);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVENTORY_ROOM_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {t(`inventory.rooms.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("inventory.destinationRoom")}</Label>
          <Select value={destinationRoom} onValueChange={(v) => setDestinationRoom(v as InventoryRoomKey)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVENTORY_ROOM_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {t(`inventory.rooms.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("inventory.status")}</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as InventoryBoxStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {t(`inventory.statuses.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("inventory.size")}</Label>
          <Select value={sizeEstimate} onValueChange={(v) => setSizeEstimate(v as InventorySizeEstimate)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVENTORY_SIZE_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {t(`inventory.sizes.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="box-weight">{t("inventory.weight")}</Label>
        <Input
          id="box-weight"
          type="number"
          min={1}
          step={1}
          placeholder={t("inventory.weightOptional")}
          value={weightLbs}
          onChange={(e) => setWeightLbs(e.target.value)}
        />
      </div>

      {assigneeOptions.length > 0 && (
        <div className="space-y-2">
          <Label>{t("inventory.assignee")}</Label>
          <Select value={assigneeEmail || "__none"} onValueChange={(v) => setAssigneeEmail(v === "__none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">{t("inventory.assigneeNone")}</SelectItem>
              {assigneeOptions.map((a) => (
                <SelectItem key={a.email} value={a.email}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="box-contents">{t("inventory.contents")}</Label>
        <textarea
          id="box-contents"
          required
          rows={3}
          value={contents}
          onChange={(e) => setContents(e.target.value)}
          placeholder={t("inventory.contentsPlaceholder")}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("inventory.photo")}</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void handlePhoto(e.target.files?.[0])}
        />
        {photoUrl ? (
          <div className="relative overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt={t("inventory.photoAlt")} className="h-36 w-full object-cover" />
            <div className="absolute right-2 top-2 flex gap-1">
              <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4" />
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setPhotoUrl(undefined)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <ImagePlus className="h-6 w-6" />
            {t("inventory.addPhoto")}
          </button>
        )}
        {photoError && <p className="text-xs text-destructive">{photoError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox id="fragile" checked={fragile} onCheckedChange={(v) => setFragile(v === true)} />
          <Label htmlFor="fragile" className="font-normal cursor-pointer">
            {t("inventory.fragile")}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="essentials" checked={essentials} onCheckedChange={(v) => setEssentials(v === true)} />
          <Label htmlFor="essentials" className="font-normal cursor-pointer">
            {t("inventory.essentials")}
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        {onDelete ? (
          <Button type="button" variant="ghost" className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            {t("inventory.deleteBox")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={!contents.trim()}>
            {initial ? t("common.update") : t("inventory.addBox")}
          </Button>
        </div>
      </div>
    </form>
  );
}
