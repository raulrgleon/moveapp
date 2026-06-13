import {
  effectiveDestinationRoom,
  INVENTORY_ROOM_KEYS,
  type InventoryBox,
  type InventoryRoomKey,
} from "@/lib/inventory/types";

export interface RoomProgressRow {
  room: InventoryRoomKey;
  total: number;
  packed: number;
  inTransit: number;
  delivered: number;
  percent: number;
}

function tallyRoom(
  boxes: InventoryBox[],
  pickRoom: (b: InventoryBox) => InventoryRoomKey
): RoomProgressRow[] {
  const map = new Map<InventoryRoomKey, RoomProgressRow>();

  for (const box of boxes) {
    const room = pickRoom(box);
    const row = map.get(room) ?? {
      room,
      total: 0,
      packed: 0,
      inTransit: 0,
      delivered: 0,
      percent: 0,
    };
    row.total += 1;
    if (box.status === "packed") row.packed += 1;
    else if (box.status === "in_transit") row.inTransit += 1;
    else if (box.status === "delivered") row.delivered += 1;
    map.set(room, row);
  }

  return INVENTORY_ROOM_KEYS.filter((k) => map.has(k)).map((room) => {
    const row = map.get(room)!;
    const moved = row.inTransit + row.delivered;
    return {
      ...row,
      percent: row.total ? Math.round((moved / row.total) * 100) : 0,
    };
  });
}

export function originRoomProgress(boxes: InventoryBox[]): RoomProgressRow[] {
  return tallyRoom(boxes, (b) => b.room);
}

export function destinationRoomProgress(boxes: InventoryBox[]): RoomProgressRow[] {
  return tallyRoom(boxes, effectiveDestinationRoom);
}

export function inventoryStats(boxes: InventoryBox[]) {
  return {
    withoutPhoto: boxes.filter((b) => !b.photoUrl).length,
    stillPacked: boxes.filter((b) => b.status === "packed").length,
    inTransit: boxes.filter((b) => b.status === "in_transit").length,
    delivered: boxes.filter((b) => b.status === "delivered").length,
    fragile: boxes.filter((b) => b.fragile).length,
    essentials: boxes.filter((b) => b.essentials).length,
    total: boxes.length,
  };
}
