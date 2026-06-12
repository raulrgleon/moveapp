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
import { apiFetch } from "@/lib/api-client";
import { loadUserData } from "@/lib/data-cache";
import { MOVE_PROFILE_UPDATED } from "@/lib/move/profile-events";
import type { ChecklistTask, TaskStatus } from "@/lib/types";

interface ChecklistContextValue {
  tasks: ChecklistTask[];
  isHydrated: boolean;
  setTaskStatus: (id: string, status: TaskStatus) => void;
}

const ChecklistContext = createContext<ChecklistContextValue | null>(null);

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isHydrated: authHydrated } = useAuth();
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const saveToDb = useCallback(
    async (next: ChecklistTask[]) => {
      if (!isAuthenticated || !user?.email) return;
      await apiFetch("/api/checklist", {
        method: "PUT",
        body: JSON.stringify({ tasks: next }),
      });
    },
    [isAuthenticated, user?.email]
  );

  useEffect(() => {
    if (!authHydrated) return;

    async function load() {
      if (isAuthenticated && user?.email) {
        try {
          const data = await loadUserData(user.email);
          setTasks(data.checklist);
        } catch {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
      setIsHydrated(true);
    }

    load();
  }, [authHydrated, isAuthenticated, user?.email]);

  useEffect(() => {
    if (!authHydrated || !isAuthenticated || !user?.email) return;

    async function reload() {
      try {
        const data = await loadUserData(user!.email, true);
        setTasks(data.checklist);
      } catch {
        /* keep current tasks */
      }
    }

    window.addEventListener(MOVE_PROFILE_UPDATED, reload);
    return () => window.removeEventListener(MOVE_PROFILE_UPDATED, reload);
  }, [authHydrated, isAuthenticated, user?.email]);

  const setTaskStatus = useCallback(
    (id: string, status: TaskStatus) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, status } : t));
        void saveToDb(next);
        return next;
      });
    },
    [saveToDb]
  );

  const value = useMemo(
    () => ({ tasks, isHydrated, setTaskStatus }),
    [tasks, isHydrated, setTaskStatus]
  );

  return (
    <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
  );
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error("useChecklist must be used within ChecklistProvider");
  return ctx;
}
