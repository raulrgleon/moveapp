import type { ChecklistTask, MovingPlanWeek } from "@/lib/types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function buildPlanWeeksFromChecklist(
  tasks: ChecklistTask[],
  moveDate: string,
  locale: "en" | "es" = "en"
): MovingPlanWeek[] {
  const move = startOfDay(new Date(moveDate));
  const today = startOfDay(new Date());

  if (Number.isNaN(move.getTime()) || tasks.length === 0) return [];

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
  if (weekNumbers.length === 0) return [];

  return weekNumbers.map((w) => {
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
