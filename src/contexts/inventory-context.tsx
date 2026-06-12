"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { useMove } from "@/contexts/move-context";
import { apiFetch } from "@/lib/api-client";
import { loadUserData } from "@/lib/data-cache";
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

function legacyToBox(item: (typeof INVENTORY_BOXES)[number], index: number): InventoryBox {
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

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isHydrated: authHydrated } = useAuth();
  const { canEdit } = useMove();
  const [boxes, setBoxes] = useState<InventoryBox[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const saveToDb = useCallback(async (next: InventoryBox[]) => {
    if (!isAuthenticated || !user?.email || !canEdit) return;
    await apiFetch("/api/inventory", {
      method: "PUT",
      body: JSON.stringify({ boxes: next }),
    });
  }, [isAuthenticated, user?.email, canEdit]);

  useEffect(() => {
    if (!authHydrated) return;

    async function load() {
      if (isAuthenticated && user?.email) {
        try {
          const data = await loadUserData(user.email);
          setBoxes(data.inventory);
        } catch {
          setBoxes([]);
        }
      } else {
        setBoxes([]);
      }
      setIsHydrated(true);
    }

    load();
  }, [authHydrated, isAuthenticated, user?.email]);

  const persist = useCallback(
    (next: InventoryBox[]) => {
      setBoxes(next);
      void saveToDb(next);
    },
    [saveToDb]
  );

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
    [boxes, isHydrated, addBox, updateBox, removeBox, setBoxStatus, getBoxByNumber, resetToDemo]
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
