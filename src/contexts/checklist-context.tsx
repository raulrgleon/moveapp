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
import { invalidateUserData, loadUserData } from "@/lib/data-cache";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";
import type { ChecklistTask, TaskStatus } from "@/lib/types";

interface ChecklistContextValue {
  tasks: ChecklistTask[];
  isHydrated: boolean;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  addTask: (task: Omit<ChecklistTask, "id">) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, patch: Partial<ChecklistTask>) => Promise<void>;
}

const ChecklistContext = createContext<ChecklistContextValue | null>(null);

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isHydrated: authHydrated } = useAuth();
  const { canEdit } = useMove();
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const saveToDb = useCallback(
    async (next: ChecklistTask[]) => {
      if (!isAuthenticated || !user?.email || !canEdit) return;
      await apiFetch("/api/checklist", {
        method: "PUT",
        body: JSON.stringify({ tasks: next }),
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

    return subscribeProfileUpdated(() => {
      void loadUserData(user.email, true)
        .then((data) => setTasks(data.checklist))
        .catch(() => {});
    });
  }, [authHydrated, isAuthenticated, user?.email]);

  const setTaskStatus = useCallback(
    (id: string, status: TaskStatus) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, status } : t));
        void apiFetch("/api/checklist", {
          method: "PATCH",
          body: JSON.stringify({ id, status }),
        }).catch(() => saveToDb(next));
        return next;
      });
    },
    [saveToDb]
  );

  const addTask = useCallback(
    async (task: Omit<ChecklistTask, "id">) => {
      if (!canEdit) return;
      const res = await apiFetch("/api/checklist", {
        method: "POST",
        body: JSON.stringify(task),
      });
      const data = (await res.json()) as { task: ChecklistTask };
      setTasks((prev) => [...prev, data.task]);
      invalidateUserData();
    },
    [canEdit]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!canEdit) return;
      await apiFetch(`/api/checklist?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      invalidateUserData();
    },
    [canEdit]
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<ChecklistTask>) => {
      if (!canEdit) return;
      const res = await apiFetch("/api/checklist", {
        method: "PATCH",
        body: JSON.stringify({ id, ...patch }),
      });
      const data = (await res.json()) as { task: ChecklistTask };
      setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
      invalidateUserData();
    },
    [canEdit]
  );

  const value = useMemo(
    () => ({ tasks, isHydrated, setTaskStatus, addTask, deleteTask, updateTask }),
    [tasks, isHydrated, setTaskStatus, addTask, deleteTask, updateTask]
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
