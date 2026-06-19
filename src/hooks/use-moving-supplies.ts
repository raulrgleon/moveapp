"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";
import { SUPPLY_ITEMS, type SupplyItemDef } from "@/lib/inventory/supplies";

function loadGuestChecks(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("movepilot_guest_supply_checks");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveGuestChecks(checks: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("movepilot_guest_supply_checks", JSON.stringify(checks));
}

export function clearGuestSupplyChecks() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("movepilot_guest_supply_checks");
}

/** Moving supplies checklist — persisted in PostgreSQL for authenticated users. */
export function useMovingSupplies() {
  const { isAuthenticated, isHydrated: authHydrated } = useAuth();
  const [checked, setCheckedState] = useState<Record<string, boolean>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setCheckedState(loadGuestChecks());
      setIsHydrated(true);
      return;
    }
    try {
      const res = await apiFetch("/api/move/supplies");
      const json = (await res.json()) as { checks?: Record<string, boolean> };
      setCheckedState(json.checks ?? {});
    } catch {
      setCheckedState({});
    } finally {
      setIsHydrated(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authHydrated) return;
    void load();
    return subscribeProfileUpdated(() => void load());
  }, [authHydrated, load]);

  const persist = useCallback(
    async (next: Record<string, boolean>) => {
      setCheckedState(next);
      if (!isAuthenticated) {
        saveGuestChecks(next);
        return;
      }
      await apiFetch("/api/move/supplies", {
        method: "PATCH",
        body: JSON.stringify({ checks: next }),
      });
    },
    [isAuthenticated]
  );

  const toggle = useCallback(
    (id: string, value?: boolean) => {
      setCheckedState((prev) => {
        const next = { ...prev, [id]: value ?? !prev[id] };
        void persist(next);
        return next;
      });
    },
    [persist]
  );

  const reset = useCallback(() => {
    void persist({});
  }, [persist]);

  const markAll = useCallback(
    (items: SupplyItemDef[] = SUPPLY_ITEMS) => {
      const next = Object.fromEntries(items.map((item) => [item.id, true]));
      void persist(next);
    },
    [persist]
  );

  return { checked, toggle, reset, markAll, isHydrated };
}
