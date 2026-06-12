import type { Locale } from "@/lib/i18n";
import {
  addDaysLocal,
  daysBetweenLocal,
  formatLocalISO,
  formatShortDateRange,
  parseLocalDate,
  startOfDay,
} from "@/lib/dates/local-date";
import type { ChecklistTask, MovingPlanWeek } from "@/lib/types";

const MILESTONE_DAYS = [30, 7, 1] as const;

const EN_MOVE_DAY_TASKS = [
  "Load the truck or trailer and depart",
  "Travel to your new home",
  "Arrive and start unloading essentials",
];

const ES_MOVE_DAY_TASKS = [
  "Cargar camión o remolque y salir",
  "Viajar a tu nuevo hogar",
  "Llegar y empezar a descargar lo esencial",
];

const EN_MILESTONE_TASKS: Record<number, string[]> = {
  30: [
    "Confirm moving truck or trailer reservation",
    "Notify landlord or schedule home sale closing",
    "Research schools and healthcare in destination",
  ],
  7: [
    "Confirm moving day logistics with helpers",
    "Pack essentials and moving-day bag",
    "Defrost refrigerator and prep appliances",
  ],
  1: [
    "Final walkthrough of old home",
    "Charge devices and pack chargers",
    "Keep IDs, keys, and documents accessible",
  ],
};

const ES_MILESTONE_TASKS: Record<number, string[]> = {
  30: [
    "Confirmar reserva de camión o remolque",
    "Notificar arrendador o cerrar venta de hogar",
    "Investigar escuelas y salud en el destino",
  ],
  7: [
    "Confirmar logística del día con ayudantes",
    "Empacar esenciales y bolsa del día de mudanza",
    "Descongelar refrigerador y preparar electrodomésticos",
  ],
  1: [
    "Recorrido final del hogar anterior",
    "Cargar dispositivos y empacar cargadores",
    "Mantener IDs, llaves y documentos accesibles",
  ],
};

type PhaseKind = "before" | "move_day" | "after";

interface PhaseBucket {
  key: string;
  kind: PhaseKind;
  sortKey: number;
  startDate: Date;
  endDate: Date;
  weekNum?: number;
  tasks: string[];
}

function phaseStatus(start: Date, end: Date, today: Date): MovingPlanWeek["status"] {
  if (today > end) return "completed";
  if (today >= start && today <= end) return "current";
  return "upcoming";
}

function beforeMoveWeekBounds(move: Date, weekNum: number): { start: Date; end: Date } {
  const end = addDaysLocal(move, -1 - (weekNum - 1) * 7);
  const start = addDaysLocal(move, -7 - (weekNum - 1) * 7);
  return { start, end };
}

function afterMoveWeekBounds(move: Date, weekNum: number): { start: Date; end: Date } {
  const start = addDaysLocal(move, 1 + (weekNum - 1) * 7);
  const end = addDaysLocal(move, 7 + (weekNum - 1) * 7);
  return { start, end };
}

function phaseLabel(
  kind: PhaseKind,
  weekNum: number | undefined,
  locale: Locale
): string {
  if (kind === "move_day") {
    return locale === "es" ? "Día de la mudanza" : "Moving day";
  }
  if (kind === "after") {
    const w = weekNum ?? 1;
    if (locale === "es") {
      return w === 1 ? "1 semana después" : `${w} semanas después`;
    }
    return w === 1 ? "1 week after move" : `${w} weeks after move`;
  }
  const w = weekNum ?? 1;
  if (locale === "es") {
    return w === 1 ? "1 semana antes" : `${w} semanas antes`;
  }
  return w === 1 ? "1 week before move" : `${w} weeks before move`;
}

function getOrCreatePhase(
  phases: Map<string, PhaseBucket>,
  key: string,
  init: Omit<PhaseBucket, "tasks">
): PhaseBucket {
  let phase = phases.get(key);
  if (!phase) {
    phase = { ...init, tasks: [] };
    phases.set(key, phase);
  }
  return phase;
}

function addMilestoneTasks(
  phases: Map<string, PhaseBucket>,
  move: Date,
  locale: Locale
) {
  const milestoneTasks = locale === "es" ? ES_MILESTONE_TASKS : EN_MILESTONE_TASKS;

  for (const days of MILESTONE_DAYS) {
    const daysBefore = days;
    const weekNum = Math.max(1, Math.ceil(daysBefore / 7));
    const { start, end } = beforeMoveWeekBounds(move, weekNum);
    const key = `before-${weekNum}`;
    const phase = getOrCreatePhase(phases, key, {
      key,
      kind: "before",
      sortKey: daysBefore,
      startDate: start,
      endDate: end,
      weekNum,
    });

    for (const task of milestoneTasks[days]) {
      if (!phase.tasks.includes(task)) {
        phase.tasks.push(task);
      }
    }
  }
}

export function buildPlanWeeksFromChecklist(
  tasks: ChecklistTask[],
  moveDate: string,
  locale: Locale = "en"
): MovingPlanWeek[] {
  const move = parseLocalDate(moveDate);
  const today = startOfDay(new Date());
  if (Number.isNaN(move.getTime())) return [];

  const phases = new Map<string, PhaseBucket>();

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const due = parseLocalDate(task.dueDate);
    const daysBeforeMove = daysBetweenLocal(due, move);

    if (daysBeforeMove === 0) {
      const phase = getOrCreatePhase(phases, "move-day", {
        key: "move-day",
        kind: "move_day",
        sortKey: 0,
        startDate: move,
        endDate: move,
      });
      phase.tasks.push(task.title);
      continue;
    }

    if (daysBeforeMove < 0) {
      const daysAfter = Math.abs(daysBeforeMove);
      const weekNum = Math.max(1, Math.ceil(daysAfter / 7));
      const { start, end } = afterMoveWeekBounds(move, weekNum);
      const phase = getOrCreatePhase(phases, `after-${weekNum}`, {
        key: `after-${weekNum}`,
        kind: "after",
        sortKey: -daysAfter,
        startDate: start,
        endDate: end,
        weekNum,
      });
      phase.tasks.push(task.title);
      continue;
    }

    const weekNum = Math.max(1, Math.ceil(daysBeforeMove / 7));
    const { start, end } = beforeMoveWeekBounds(move, weekNum);
    const phase = getOrCreatePhase(phases, `before-${weekNum}`, {
      key: `before-${weekNum}`,
      kind: "before",
      sortKey: daysBeforeMove,
      startDate: start,
      endDate: end,
      weekNum,
    });
    phase.tasks.push(task.title);
  }

  addMilestoneTasks(phases, move, locale);

  const moveDayPhase = getOrCreatePhase(phases, "move-day", {
    key: "move-day",
    kind: "move_day",
    sortKey: 0,
    startDate: move,
    endDate: move,
  });
  const moveDayDefaults = locale === "es" ? ES_MOVE_DAY_TASKS : EN_MOVE_DAY_TASKS;
  for (const task of moveDayDefaults) {
    if (!moveDayPhase.tasks.includes(task)) {
      moveDayPhase.tasks.push(task);
    }
  }

  const daysUntilMove = daysBetweenLocal(today, move);
  const maxRelevantWeeks = Math.max(1, Math.ceil(Math.max(daysUntilMove, 0) / 7) + 1);

  const sorted = Array.from(phases.values())
    .filter((phase) => {
      if (phase.kind === "move_day" || phase.kind === "after") return true;
      if (phase.tasks.length === 0) return false;
      if (phase.endDate >= today) return true;
      if (phase.weekNum != null && phase.weekNum <= maxRelevantWeeks + 1) return true;
      return phase.tasks.length > 0 && phase.endDate >= addDaysLocal(today, -14);
    })
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return sorted.map((phase) => ({
    week: phase.weekNum ?? (phase.kind === "move_day" ? 0 : 1),
    label: phaseLabel(phase.kind, phase.weekNum, locale),
    dateRange: formatShortDateRange(phase.startDate, phase.endDate, locale),
    startDate: formatLocalISO(phase.startDate),
    endDate: formatLocalISO(phase.endDate),
    tasks: phase.tasks,
    status: phaseStatus(phase.startDate, phase.endDate, today),
    kind: phase.kind,
  }));
}

export function priorityTasksFromChecklist(tasks: ChecklistTask[], limit = 5) {
  const order = { high: 0, medium: 1, low: 2 };
  return [...tasks]
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      const pa = order[a.priority] ?? 1;
      const pb = order[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return 0;
    })
    .slice(0, limit);
}
