"use client";

import Link from "next/link";
import { useChecklist } from "@/contexts/checklist-context";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  DollarSign,
  Info,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardUtilitiesCard } from "@/components/dashboard/dashboard-utilities-card";
import { DashboardHousingCard } from "@/components/dashboard/dashboard-housing-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { NextActionCard } from "@/components/dashboard/next-action-card";
import { RouteWeatherPanel } from "@/components/dashboard/route-weather-panel";
import { useRouteStats } from "@/hooks/use-route-stats";
import { ALERTS, QUICK_ACTIONS } from "@/lib/mock-data";
import { daysUntil, formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useMove();
  const { tasks } = useChecklist();
  const { stats: routeStats } = useRouteStats();
  const daysLeft = daysUntil(profile.moveDate);
  const completed = tasks.filter((task) => task.status === "completed").length;
  const taskProgress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const pendingHigh = tasks.filter((t) => t.status !== "completed" && t.priority === "high").length;

  return (
    <>
      <DashboardHeader
        title={t("dashboard.title")}
        description={t("common.welcomeBack", { name: profile.name.split(" ")[0] })}
      />
      <PageContainer>
        <PageHeader
          title={t("dashboardPage.overview")}
          description={t("dashboardPage.overviewDesc")}
        />

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{t("dashboardPage.movingRoute")}</p>
                  <p className="text-lg sm:text-xl font-semibold break-words">
                    {profile.origin} → {profile.destination}
                  </p>
                  {routeStats && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {routeStats.distanceMiles.toLocaleString()} mi · {routeStats.driveTimeLabel} drive
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 shrink-0">
                <Button variant="outline" size="sm" asChild className="self-start sm:self-center">
                  <Link href="/settings">{t("settings.updateMove")}</Link>
                </Button>
                <div>
                  <p className="text-muted-foreground text-sm">{t("dashboardPage.moveDate")}</p>
                  <p className="font-medium">{formatDate(profile.moveDate, locale)}</p>
                </div>
                <div className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-center sm:text-left">
                  <p className="text-xs opacity-80">{t("dashboardPage.countdown")}</p>
                  <p className="text-2xl font-bold">{t("dashboardPage.days", { days: daysLeft })}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("dashboardPage.estimatedBudget")}
            value={formatCurrency(profile.budget, locale)}
            subtext={t("dashboardPage.budgetTarget")}
            icon={DollarSign}
          />
          <StatCard
            label={t("dashboardPage.taskProgress")}
            value={`${taskProgress}%`}
            subtext={t("checklistPage.progressDesc", {
              completed,
              total: tasks.length,
            })}
            icon={CheckCircle2}
          />
          <StatCard
            label={t("dashboardPage.priorityOpen")}
            value={String(pendingHigh)}
            subtext={t("dashboardPage.highPriorityTasks")}
            icon={TrendingUp}
          />
          <StatCard
            label={t("dashboardPage.daysUntilMove")}
            value={`${daysLeft}`}
            subtext={formatDate(profile.moveDate, locale)}
            icon={Calendar}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboardPage.taskProgress")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{t("checklistPage.overallProgress")}</span>
                  <span className="font-medium">{taskProgress}%</span>
                </div>
                <Progress value={taskProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <NextActionCard />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboardPage.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <Button key={action.id} variant="outline" className="w-full justify-between" asChild>
                <Link href={action.href}>
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <DashboardHousingCard />

        <RouteWeatherPanel compact />

        <DashboardUtilitiesCard />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboardPage.alerts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ALERTS.map((alert) => (
              <div key={alert.id} className="flex gap-3 rounded-lg border p-4">
                {alert.type === "warning" && (
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                {alert.type === "info" && (
                  <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                )}
                {alert.type === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <Badge variant="outline" className="text-xs">{alert.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
