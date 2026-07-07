"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import type { ShoppingSelectionRecord } from "@/lib/amazon/shopping-selections";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";

export function useShoppingSelections(enabled: boolean) {
  const { isAuthenticated, isHydrated: authHydrated } = useAuth();
  const [selections, setSelections] = useState<ShoppingSelectionRecord[] | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !isAuthenticated) {
      setSelections(null);
      setIsHydrated(true);
      return;
    }
    try {
      const res = await apiFetch("/api/move/shopping-selections");
      const json = (await res.json()) as { selections?: ShoppingSelectionRecord[] };
      setSelections(json.selections ?? []);
    } catch {
      setSelections([]);
    } finally {
      setIsHydrated(true);
    }
  }, [enabled, isAuthenticated]);

  useEffect(() => {
    if (!authHydrated) return;
    void load();
    return subscribeProfileUpdated(() => void load());
  }, [authHydrated, load]);

  const persist = useCallback(
    (next: ShoppingSelectionRecord[]) => {
      setSelections(next);
      if (!isAuthenticated) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void apiFetch("/api/move/shopping-selections", {
          method: "PATCH",
          body: JSON.stringify({ selections: next }),
        });
      }, 400);
    },
    [isAuthenticated]
  );

  return { selections, persist, isHydrated, reload: load };
}
