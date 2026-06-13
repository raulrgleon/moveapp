import type { InventoryBoxInput, InventoryRoomKey } from "@/lib/inventory/types";

export interface InventoryTemplate {
  id: string;
  labelKey: string;
  boxes: InventoryBoxInput[];
}

export const INVENTORY_TEMPLATES: InventoryTemplate[] = [
  {
    id: "kitchen",
    labelKey: "inventory.templatesKitchen",
    boxes: [
      {
        room: "kitchen",
        destinationRoom: "kitchen",
        contents: "Plates, bowls, mugs",
        fragile: true,
        essentials: false,
        sizeEstimate: "m",
        status: "packed",
      },
      {
        room: "kitchen",
        destinationRoom: "kitchen",
        contents: "Pots, pans, utensils",
        fragile: false,
        essentials: false,
        sizeEstimate: "l",
        status: "packed",
      },
      {
        room: "kitchen",
        destinationRoom: "kitchen",
        contents: "Pantry dry goods & spices",
        fragile: false,
        essentials: false,
        sizeEstimate: "m",
        status: "packed",
      },
    ],
  },
  {
    id: "bathroom",
    labelKey: "inventory.templatesBathroom",
    boxes: [
      {
        room: "bathroom",
        destinationRoom: "bathroom",
        contents: "Towels, toiletries, medicines",
        fragile: false,
        essentials: false,
        sizeEstimate: "m",
        status: "packed",
      },
    ],
  },
  {
    id: "bedroom",
    labelKey: "inventory.templatesBedroom",
    boxes: [
      {
        room: "masterBedroom",
        destinationRoom: "masterBedroom",
        contents: "Bedding & pillows",
        fragile: false,
        essentials: false,
        sizeEstimate: "l",
        status: "packed",
      },
      {
        room: "masterBedroom",
        destinationRoom: "masterBedroom",
        contents: "Clothes — one week",
        fragile: false,
        essentials: false,
        sizeEstimate: "m",
        status: "packed",
      },
    ],
  },
  {
    id: "essentials",
    labelKey: "inventory.templatesEssentials",
    boxes: [
      {
        room: "other",
        destinationRoom: "masterBedroom",
        contents: "First night: toiletries, chargers, snacks, change of clothes",
        fragile: false,
        essentials: true,
        sizeEstimate: "s",
        status: "packed",
      },
    ],
  },
  {
    id: "office",
    labelKey: "inventory.templatesOffice",
    boxes: [
      {
        room: "office",
        destinationRoom: "office",
        contents: "Electronics, cables, desk supplies",
        fragile: true,
        essentials: false,
        sizeEstimate: "m",
        status: "packed",
      },
    ],
  },
];
