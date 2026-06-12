"use client";

import { Download } from "lucide-react";
import { useMovingPlan } from "@/contexts/moving-plan-context";
import { householdWithPets, useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { PriorityBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function MovingPlanPage() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useMove();
  const { weeks, priorityTasks, exportPlan } = useMovingPlan();

  return (
    <>
      <DashboardHeader title={t("movingPlanPage.title")} description={t("movingPlanPage.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("movingPlanPage.pageTitle")}
          description={t("movingPlanPage.pageDesc", {
            origin: profile.origin,
            destination: profile.destination,
          })}
          action={
            <Button size="sm" onClick={exportPlan}>
              <Download className="mr-2 h-4 w-4" />
              {t("movingPlanPage.export")}
            </Button>
          }
        />

        <Card>
          <CardContent className="p-6">
            <p className="font-medium">{t("movingPlanPage.planSummary")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("movingPlanPage.planSummaryDesc", {
                date: formatDate(profile.moveDate, locale),
                household: householdWithPets(profile),
                budget: formatCurrency(profile.budget, locale),
                rental: profile.rentalPreference,
              })}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold">{t("movingPlanPage.timeline")}</h3>
            {weeks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("movingPlanPage.noTimeline")}</p>
            ) : (
              weeks.map((week) => (
                <Card
                  key={week.week}
                  className={cn(
                    week.status === "current" && "border-primary shadow-sm",
                    week.status === "completed" && "opacity-80"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{week.label}</CardTitle>
                      <Badge
                        variant={
                          week.status === "completed"
                            ? "success"
                            : week.status === "current"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {week.status === "completed"
                          ? t("movingPlanPage.completed")
                          : week.status === "current"
                            ? t("movingPlanPage.current")
                            : t("movingPlanPage.upcoming")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {week.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("movingPlanPage.priorityTasks")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {priorityTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("movingPlanPage.noPriority")}</p>
                ) : (
                  priorityTasks.map((task) => (
                    <div key={task.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <p className="text-sm font-medium">{task.title}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {t("checklistPage.due", { date: formatDate(task.dueDate, locale) })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
