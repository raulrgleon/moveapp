import type { ChecklistTask, MovingPlanWeek } from "@/lib/types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const MILESTONE_DAYS = [30, 7, 1] as const;

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

function milestoneLabel(days: number, locale: "en" | "es"): string {
  if (locale === "es") {
    if (days === 1) return "1 día antes";
    return `${days} días antes`;
  }
  if (days === 1) return "1 day before move";
  return `${days} days before move`;
}

function mergeMilestoneWeeks(
  weeks: MovingPlanWeek[],
  moveDate: string,
  locale: "en" | "es"
): MovingPlanWeek[] {
  const move = startOfDay(new Date(moveDate));
  const today = startOfDay(new Date());
  if (Number.isNaN(move.getTime())) return weeks;

  const milestoneWeeks: MovingPlanWeek[] = MILESTONE_DAYS.map((days) => {
    const milestoneDate = new Date(move);
    milestoneDate.setDate(milestoneDate.getDate() - days);
    let status: MovingPlanWeek["status"] = "upcoming";
    if (today >= move) status = "completed";
    else if (today >= milestoneDate) status = "current";

    const tasks =
      locale === "es" ? ES_MILESTONE_TASKS[days] : EN_MILESTONE_TASKS[days];

    return {
      week: days,
      label: milestoneLabel(days, locale),
      tasks,
      status,
    };
  });

  const existingLabels = new Set(weeks.map((w) => w.label));
  const merged = [...weeks];
  for (const mw of milestoneWeeks) {
    if (!existingLabels.has(mw.label)) {
      merged.push(mw);
    }
  }

  return merged.sort((a, b) => {
    const aDays = a.label.match(/\d+/)?.[0] ?? "0";
    const bDays = b.label.match(/\d+/)?.[0] ?? "0";
    return Number(bDays) - Number(aDays);
  });
}

export function buildPlanWeeksFromChecklist(
  tasks: ChecklistTask[],
  moveDate: string,
  locale: "en" | "es" = "en"
): MovingPlanWeek[] {
  const move = startOfDay(new Date(moveDate));
  const today = startOfDay(new Date());

  const buckets = new Map<number, string[]>();

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const due = startOfDay(new Date(task.dueDate));
    const daysBefore = Math.ceil((move.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const weekNum = Math.max(1, Math.ceil(Math.max(0, daysBefore) / 7) || 1);
    const list = buckets.get(weekNum) ?? [];
    list.push(task.title);
    buckets.set(weekNum, list);
  }

  const weekNumbers = Array.from(buckets.keys()).sort((a, b) => b - a);
  let weeks: MovingPlanWeek[] = [];

  if (weekNumbers.length > 0) {
    weeks = weekNumbers.map((w) => {
      const weekEnd = new Date(move);
      weekEnd.setDate(weekEnd.getDate() - (w - 1) * 7);
      const weekStart = new Date(move);
      weekStart.setDate(weekStart.getDate() - w * 7);

      let status: MovingPlanWeek["status"] = "upcoming";
      if (today >= weekEnd) status = "completed";
      else if (today >= weekStart) status = "current";

      const label =
        locale === "es"
          ? w === 1
            ? "1 semana antes"
            : `${w} semanas antes`
          : w === 1
            ? "1 week before move"
            : `${w} weeks before move`;

      return {
        week: w,
        label,
        tasks: buckets.get(w) ?? [],
        status,
      };
    });
  }

  return mergeMilestoneWeeks(weeks, moveDate, locale);
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
