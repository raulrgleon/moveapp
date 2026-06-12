"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useChecklist } from "@/contexts/checklist-context";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { ChecklistTask } from "@/lib/types";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: ChecklistTask[]) {
  return [...tasks]
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 1;
      const pb = PRIORITY_ORDER[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return 0;
    })
    .slice(0, 3);
}

export function NextActionCard() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useMove();
  const { tasks, setTaskStatus } = useChecklist();
  const next = sortTasks(tasks);

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("dashboardPage.nextAction")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {next.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboardPage.allCaughtUp")}</p>
        ) : (
          next.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
            >
              <button
                type="button"
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary"
                onClick={() => setTaskStatus(task.id, "completed")}
                aria-label={t("checklistPage.markComplete")}
              >
                <Circle className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.title}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{task.category}</span>
                  {task.dueDate && (
                    <span>{t("checklistPage.due", { date: formatDate(task.dueDate, locale) })}</span>
                  )}
                  {task.priority === "high" && (
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                      {task.priority}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <Button variant="outline" className="w-full justify-between" asChild>
          <Link href="/checklist">
            {t("dashboardPage.viewAllTasks")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {next.length > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t("dashboardPage.nextActionHint", {
              city: profile.destination.split(",")[0],
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
