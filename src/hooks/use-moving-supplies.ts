"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SUPPLY_ITEMS,
  suppliesStorageKey,
  type SupplyItemDef,
} from "@/lib/inventory/supplies";

function loadChecked(key: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function useMovingSupplies(profile: {
  email?: string;
  origin?: string;
  destination?: string;
  moveDate?: string;
}) {
  const storageKey = suppliesStorageKey(profile);
  const [checked, setCheckedState] = useState<Record<string, boolean>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setCheckedState(loadChecked(storageKey));
    setIsHydrated(true);
  }, [storageKey]);

  const persist = useCallback(
    (next: Record<string, boolean>) => {
      setCheckedState(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
    },
    [storageKey]
  );

  const toggle = useCallback(
    (id: string, value?: boolean) => {
      setCheckedState((prev) => {
        const next = { ...prev, [id]: value ?? !prev[id] };
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
        return next;
      });
    },
    [storageKey]
  );

  const reset = useCallback(() => {
    persist({});
  }, [persist]);

  const markAll = useCallback(
    (items: SupplyItemDef[] = SUPPLY_ITEMS) => {
      const next = Object.fromEntries(items.map((item) => [item.id, true]));
      persist(next);
    },
    [persist]
  );

  return { checked, toggle, reset, markAll, isHydrated };
}
