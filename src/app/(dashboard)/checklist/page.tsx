"use client";

import { useState } from "react";
import { useChecklist } from "@/contexts/checklist-context";
import { useLocale, useT } from "@/contexts/locale-context";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  PriorityBadge,
  TaskStatusBadge,
} from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHECKLIST_CATEGORIES } from "@/lib/constants";
import type { TaskStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUS_CYCLE: TaskStatus[] = ["pending", "in_progress", "completed"];

export default function ChecklistPage() {
  const t = useT();
  const { locale } = useLocale();
  const { tasks, setTaskStatus } = useChecklist();
  const [filter, setFilter] = useState("all");

  const completed = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((task) => task.category === filter);

  const cycleStatus = (current: TaskStatus): TaskStatus => {
    const idx = STATUS_CYCLE.indexOf(current);
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  };

  return (
    <>
      <DashboardHeader title={t("checklistPage.title")} description={t("checklistPage.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("checklistPage.pageTitle")}
          description={t("checklistPage.progressDesc", {
            completed,
            total: tasks.length,
          })}
        />

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("checklistPage.overallProgress")}</p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
              <Progress value={progress} className="w-full sm:w-64 h-3" />
            </div>
          </CardContent>
        </Card>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex h-auto w-full overflow-x-auto flex-nowrap justify-start gap-1 pb-1">
            <TabsTrigger value="all">{t("checklistPage.all")}</TabsTrigger>
            {CHECKLIST_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {filter === "all" ? t("checklistPage.allTasks") : filter}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{task.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {t("checklistPage.due", { date: formatDate(task.dueDate, locale) })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={task.priority} />
                      <TaskStatusBadge status={task.status} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTaskStatus(task.id, cycleStatus(task.status))}
                      >
                        {t("common.update")}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
