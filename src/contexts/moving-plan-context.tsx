"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useChecklist } from "@/contexts/checklist-context";
import { useMove } from "@/contexts/move-context";
import { useLocale } from "@/contexts/locale-context";
import {
  buildPlanWeeksFromChecklist,
  priorityTasksFromChecklist,
} from "@/lib/move/build-plan-weeks";
import type { ChecklistTask, MovingPlanWeek } from "@/lib/types";

interface MovingPlanContextValue {
  weeks: MovingPlanWeek[];
  priorityTasks: ChecklistTask[];
  isHydrated: boolean;
  exportPlan: () => void;
  exportIcal: () => void;
  exportPdf: () => void;
}

const MovingPlanContext = createContext<MovingPlanContextValue | null>(null);

export function MovingPlanProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const { profile } = useMove();
  const { tasks, isHydrated } = useChecklist();

  const weeks = useMemo(
    () => buildPlanWeeksFromChecklist(tasks, profile.moveDate, locale),
    [tasks, profile.moveDate, locale]
  );

  const priorityTasks = useMemo(() => priorityTasksFromChecklist(tasks), [tasks]);

  const exportPlan = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      moveDate: profile.moveDate,
      origin: profile.origin,
      destination: profile.destination,
      weeks,
      tasks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "movepilot-moving-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [weeks, tasks, profile]);

  const exportIcal = useCallback(() => {
    window.location.href = "/api/move/plan.ics";
  }, []);

  const exportPdf = useCallback(() => {
    window.print();
  }, []);

  const value = useMemo(
    () => ({ weeks, priorityTasks, isHydrated, exportPlan, exportIcal, exportPdf }),
    [weeks, priorityTasks, isHydrated, exportPlan, exportIcal, exportPdf]
  );

  return (
    <MovingPlanContext.Provider value={value}>{children}</MovingPlanContext.Provider>
  );
}

export function useMovingPlan() {
  const ctx = useContext(MovingPlanContext);
  if (!ctx) throw new Error("useMovingPlan must be used within MovingPlanProvider");
  return ctx;
}
