"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  MAX_PHOTO_BYTES,
  type InventoryBox,
  type InventoryBoxInput,
  type InventoryBoxStatus,
  type InventoryRoomKey,
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [room, setRoom] = useState<InventoryRoomKey>(initial?.room ?? "kitchen");
  const [contents, setContents] = useState(initial?.contents ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initial?.photoUrl);
  const [fragile, setFragile] = useState(initial?.fragile ?? false);
  const [status, setStatus] = useState<InventoryBoxStatus>(
    initial?.status ?? "packed"
  );
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhoto = (file: File | undefined) => {
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
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contents.trim()) return;
    onSubmit({ room, contents, photoUrl, fragile, status });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("inventory.room")}</Label>
          <Select value={room} onValueChange={(v) => setRoom(v as InventoryRoomKey)}>
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
      </div>

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
          onChange={(e) => handlePhoto(e.target.files?.[0])}
        />
        {photoUrl ? (
          <div className="relative overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={t("inventory.photoAlt")}
              className="h-36 w-full object-cover"
            />
            <div className="absolute right-2 top-2 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setPhotoUrl(undefined)}
              >
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

      <div className="flex items-center gap-2">
        <Checkbox
          id="fragile"
          checked={fragile}
          onCheckedChange={(v) => setFragile(v === true)}
        />
        <Label htmlFor="fragile" className="font-normal cursor-pointer">
          {t("inventory.fragile")}
        </Label>
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
