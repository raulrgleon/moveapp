"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { INVENTORY_BOXES } from "@/lib/mock-data";
import {
  createInventoryBox,
  createInventoryId,
  nextBoxNumber,
  type InventoryBox,
  type InventoryBoxInput,
  type InventoryBoxStatus,
  type InventoryRoomKey,
} from "@/lib/inventory/types";

const STORAGE_KEY = "movepilot_inventory";

interface InventoryContextValue {
  boxes: InventoryBox[];
  isHydrated: boolean;
  addBox: (input: InventoryBoxInput) => InventoryBox;
  updateBox: (id: string, input: Partial<InventoryBoxInput>) => void;
  removeBox: (id: string) => void;
  setBoxStatus: (id: string, status: InventoryBoxStatus) => void;
  getBoxByNumber: (boxNumber: number) => InventoryBox | undefined;
  resetToDemo: () => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

function legacyToBox(
  item: (typeof INVENTORY_BOXES)[number],
  index: number
): InventoryBox {
  const roomMap: Record<string, InventoryRoomKey> = {
    Kitchen: "kitchen",
    "Living Room": "livingRoom",
    "Master Bedroom": "masterBedroom",
    "Child's Room": "childRoom",
    Bathroom: "bathroom",
    Garage: "garage",
  };
  const now = new Date().toISOString();
  return {
    id: createInventoryId(),
    boxNumber: item.boxNumber ?? index + 1,
    room: roomMap[item.room] ?? "other",
    contents: item.contents,
    photoUrl: undefined,
    fragile: false,
    status: "packed",
    createdAt: now,
    updatedAt: now,
  };
}

function seedDemoBoxes(): InventoryBox[] {
  return INVENTORY_BOXES.map(legacyToBox);
}

function loadStored(): InventoryBox[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InventoryBox[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStored(boxes: InventoryBox[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boxes));
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [boxes, setBoxes] = useState<InventoryBox[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setBoxes(loadStored() ?? seedDemoBoxes());
    setIsHydrated(true);
  }, []);

  const persist = useCallback((next: InventoryBox[]) => {
    setBoxes(next);
    saveStored(next);
  }, []);

  const addBox = useCallback(
    (input: InventoryBoxInput) => {
      const box = createInventoryBox(input, nextBoxNumber(boxes));
      persist([...boxes, box]);
      return box;
    },
    [boxes, persist]
  );

  const updateBox = useCallback(
    (id: string, input: Partial<InventoryBoxInput>) => {
      const now = new Date().toISOString();
      persist(
        boxes.map((box) =>
          box.id === id
            ? {
                ...box,
                ...input,
                contents: input.contents?.trim() ?? box.contents,
                updatedAt: now,
              }
            : box
        )
      );
    },
    [boxes, persist]
  );

  const removeBox = useCallback(
    (id: string) => {
      persist(boxes.filter((box) => box.id !== id));
    },
    [boxes, persist]
  );

  const setBoxStatus = useCallback(
    (id: string, status: InventoryBoxStatus) => {
      const now = new Date().toISOString();
      persist(
        boxes.map((box) =>
          box.id === id ? { ...box, status, updatedAt: now } : box
        )
      );
    },
    [boxes, persist]
  );

  const getBoxByNumber = useCallback(
    (boxNumber: number) => boxes.find((b) => b.boxNumber === boxNumber),
    [boxes]
  );

  const resetToDemo = useCallback(() => {
    persist(seedDemoBoxes());
  }, [persist]);

  const value = useMemo(
    () => ({
      boxes,
      isHydrated,
      addBox,
      updateBox,
      removeBox,
      setBoxStatus,
      getBoxByNumber,
      resetToDemo,
    }),
    [
      boxes,
      isHydrated,
      addBox,
      updateBox,
      removeBox,
      setBoxStatus,
      getBoxByNumber,
      resetToDemo,
    ]
  );

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
