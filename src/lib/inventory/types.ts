export type InventoryRoomKey =
  | "kitchen"
  | "livingRoom"
  | "masterBedroom"
  | "childRoom"
  | "bathroom"
  | "garage"
  | "office"
  | "other";

export type InventoryBoxStatus = "packed" | "in_transit" | "delivered";

export type InventorySizeEstimate = "s" | "m" | "l";

export interface InventoryBox {
  id: string;
  boxNumber: number;
  room: InventoryRoomKey;
  destinationRoom?: InventoryRoomKey;
  contents: string;
  photoUrl?: string;
  fragile: boolean;
  essentials: boolean;
  sizeEstimate?: InventorySizeEstimate;
  weightLbs?: number;
  assigneeEmail?: string;
  status: InventoryBoxStatus;
  createdAt: string;
  updatedAt: string;
}

export const INVENTORY_ROOM_KEYS: InventoryRoomKey[] = [
  "kitchen",
  "livingRoom",
  "masterBedroom",
  "childRoom",
  "bathroom",
  "garage",
  "office",
  "other",
];

export const INVENTORY_SIZE_KEYS: InventorySizeEstimate[] = ["s", "m", "l"];

/** Default weight when size is set but weight is not (lbs). */
export const SIZE_DEFAULT_WEIGHT_LBS: Record<InventorySizeEstimate, number> = {
  s: 25,
  m: 45,
  l: 70,
};

export const MAX_PHOTO_BYTES = 800_000;

export type InventorySortKey = "boxNumber" | "room" | "status" | "updated";

export type InventoryViewMode = "grid" | "list";

export function createInventoryId(): string {
  return `box-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nextBoxNumber(boxes: InventoryBox[]): number {
  if (boxes.length === 0) return 1;
  return Math.max(...boxes.map((b) => b.boxNumber)) + 1;
}

export function effectiveDestinationRoom(box: InventoryBox): InventoryRoomKey {
  return box.destinationRoom ?? box.room;
}

export function effectiveWeightLbs(box: InventoryBox): number {
  if (box.weightLbs != null && box.weightLbs > 0) return box.weightLbs;
  if (box.sizeEstimate) return SIZE_DEFAULT_WEIGHT_LBS[box.sizeEstimate];
  return SIZE_DEFAULT_WEIGHT_LBS.m;
}

export interface InventoryBoxInput {
  room: InventoryRoomKey;
  destinationRoom?: InventoryRoomKey;
  contents: string;
  photoUrl?: string;
  fragile: boolean;
  essentials: boolean;
  sizeEstimate?: InventorySizeEstimate;
  weightLbs?: number;
  assigneeEmail?: string;
  status: InventoryBoxStatus;
}

export function createInventoryBox(
  input: InventoryBoxInput,
  boxNumber: number
): InventoryBox {
  const now = new Date().toISOString();
  return {
    id: createInventoryId(),
    boxNumber,
    room: input.room,
    destinationRoom: input.destinationRoom,
    contents: input.contents.trim(),
    photoUrl: input.photoUrl,
    fragile: input.fragile,
    essentials: input.essentials,
    sizeEstimate: input.sizeEstimate,
    weightLbs: input.weightLbs,
    assigneeEmail: input.assigneeEmail?.trim() || undefined,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };
}
