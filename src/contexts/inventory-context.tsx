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
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";
import {
  createInventoryBox,
  nextBoxNumber,
  type InventoryBox,
  type InventoryBoxInput,
  type InventoryBoxStatus,
} from "@/lib/inventory/types";

interface InventoryContextValue {
  boxes: InventoryBox[];
  isHydrated: boolean;
  addBox: (input: InventoryBoxInput) => InventoryBox;
  addBoxes: (inputs: InventoryBoxInput[]) => InventoryBox[];
  updateBox: (id: string, input: Partial<InventoryBoxInput>) => void;
  removeBox: (id: string) => void;
  removeBoxes: (ids: string[]) => void;
  setBoxStatus: (id: string, status: InventoryBoxStatus) => void;
  bulkSetStatus: (ids: string[], status: InventoryBoxStatus) => void;
  bulkUpdate: (ids: string[], patch: Partial<InventoryBoxInput>) => void;
  getBoxByNumber: (boxNumber: number) => InventoryBox | undefined;
  getBoxById: (id: string) => InventoryBox | undefined;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isHydrated: authHydrated } = useAuth();
  const { canEdit } = useMove();
  const [boxes, setBoxes] = useState<InventoryBox[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const saveToDb = useCallback(
    async (next: InventoryBox[]) => {
      if (!isAuthenticated || !user?.email || !canEdit) return;
      await apiFetch("/api/inventory", {
        method: "PUT",
        body: JSON.stringify({ boxes: next }),
      });
    },
    [isAuthenticated, user?.email, canEdit]
  );

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

    void load();
  }, [authHydrated, isAuthenticated, user?.email]);

  useEffect(() => {
    if (!authHydrated || !isAuthenticated || !user?.email) return;
    return subscribeProfileUpdated(() => {
      void loadUserData(user.email, true)
        .then((data) => setBoxes(data.inventory))
        .catch(() => {});
    });
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

  const addBoxes = useCallback(
    (inputs: InventoryBoxInput[]) => {
      let num = nextBoxNumber(boxes);
      const created = inputs.map((input) => {
        const box = createInventoryBox(input, num);
        num += 1;
        return box;
      });
      persist([...boxes, ...created]);
      return created;
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
                assigneeEmail: input.assigneeEmail?.trim() || undefined,
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

  const removeBoxes = useCallback(
    (ids: string[]) => {
      const set = new Set(ids);
      persist(boxes.filter((box) => !set.has(box.id)));
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

  const bulkSetStatus = useCallback(
    (ids: string[], status: InventoryBoxStatus) => {
      const set = new Set(ids);
      const now = new Date().toISOString();
      persist(
        boxes.map((box) =>
          set.has(box.id) ? { ...box, status, updatedAt: now } : box
        )
      );
    },
    [boxes, persist]
  );

  const bulkUpdate = useCallback(
    (ids: string[], patch: Partial<InventoryBoxInput>) => {
      const set = new Set(ids);
      const now = new Date().toISOString();
      persist(
        boxes.map((box) =>
          set.has(box.id)
            ? {
                ...box,
                ...patch,
                contents: patch.contents?.trim() ?? box.contents,
                assigneeEmail: patch.assigneeEmail?.trim() ?? box.assigneeEmail,
                updatedAt: now,
              }
            : box
        )
      );
    },
    [boxes, persist]
  );

  const getBoxByNumber = useCallback(
    (boxNumber: number) => boxes.find((b) => b.boxNumber === boxNumber),
    [boxes]
  );

  const getBoxById = useCallback(
    (id: string) => boxes.find((b) => b.id === id),
    [boxes]
  );

  const value = useMemo(
    () => ({
      boxes,
      isHydrated,
      addBox,
      addBoxes,
      updateBox,
      removeBox,
      removeBoxes,
      setBoxStatus,
      bulkSetStatus,
      bulkUpdate,
      getBoxByNumber,
      getBoxById,
    }),
    [
      boxes,
      isHydrated,
      addBox,
      addBoxes,
      updateBox,
      removeBox,
      removeBoxes,
      setBoxStatus,
      bulkSetStatus,
      bulkUpdate,
      getBoxByNumber,
      getBoxById,
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
