"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";

export interface UtilityPick {
  providerName: string;
  category: string;
  contractedAt: string;
}

export function useUtilityPicks() {
  const { isAuthenticated, isHydrated } = useAuth();
  const [picks, setPicks] = useState<UtilityPick[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setPicks([]);
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch("/api/utilities/picks");
      const json = (await res.json()) as { picks?: UtilityPick[] };
      setPicks(json.picks ?? []);
    } catch {
      setPicks([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isHydrated) return;
    void load();
    return subscribeProfileUpdated(() => void load());
  }, [isHydrated, load]);

  return { picks, count: picks.length, loading };
}
