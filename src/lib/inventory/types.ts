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

export interface InventoryBox {
  id: string;
  boxNumber: number;
  room: InventoryRoomKey;
  contents: string;
  photoUrl?: string;
  fragile: boolean;
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

export const MAX_PHOTO_BYTES = 800_000;

export function createInventoryId(): string {
  return `box-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nextBoxNumber(boxes: InventoryBox[]): number {
  if (boxes.length === 0) return 1;
  return Math.max(...boxes.map((b) => b.boxNumber)) + 1;
}

export interface InventoryBoxInput {
  room: InventoryRoomKey;
  contents: string;
  photoUrl?: string;
  fragile: boolean;
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
    contents: input.contents.trim(),
    photoUrl: input.photoUrl,
    fragile: input.fragile,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };
}
