"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useChecklist } from "@/contexts/checklist-context";
import { useDocuments } from "@/contexts/documents-context";
import { useInventory } from "@/contexts/inventory-context";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  DollarSign,
  Info,
  TrendingUp,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardUtilitiesCard } from "@/components/dashboard/dashboard-utilities-card";
import { DashboardHousingCard } from "@/components/dashboard/dashboard-housing-card";
import { DashboardInventoryCard } from "@/components/dashboard/dashboard-inventory-card";
import { MoveActivityFeed } from "@/components/dashboard/move-activity-feed";
import { CollaboratorsDashboardCard } from "@/components/collaboration/collaborators-dashboard-card";
import { UpgradeProBanner } from "@/components/billing/upgrade-pro-banner";
import { PendingInvitesBanner } from "@/components/collaboration/pending-invites-banner";
import { MoveCommandHero } from "@/components/dashboard/move-command-hero";
import { MoveBadgesRow } from "@/components/dashboard/move-badges-row";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ConfettiBurst } from "@/components/ui/confetti-burst";
import { CountUp } from "@/components/ui/count-up";
import { GettingStartedCard } from "@/components/dashboard/getting-started-card";
import { JourneyNextCard } from "@/components/dashboard/journey-next-card";
import { NextActionCard } from "@/components/dashboard/next-action-card";
import { RouteWeatherPanel } from "@/components/dashboard/route-weather-panel";
import { useRouteStats } from "@/hooks/use-route-stats";
import { calculateMoveScore } from "@/lib/gamification/move-score";
import { hasRouteCoordinates } from "@/lib/move/profile-completeness";
import { generateAlerts } from "@/lib/dashboard/generate-alerts";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";
import { apiFetch } from "@/lib/api-client";
import { daysUntil, formatCurrency, formatDate } from "@/lib/utils";

const QUICK_ACTION_KEYS = [
  { id: "utilities", href: "/utilities", labelKey: "dashboardPage.quickActionUtilities" },
  { id: "checklist", href: "/checklist", labelKey: "dashboardPage.quickActionChecklist" },
  { id: "trucks", href: "/trucks", labelKey: "dashboardPage.quickActionTrucks" },
  { id: "budget", href: "/budget", labelKey: "dashboardPage.quickActionBudget" },
] as const;

const CELEBRATE_KEY = "movepilot_celebrate";

export default function DashboardPage() {
  const t = useT();
  const { locale } = useLocale();
  const { profile, vehicles, isAddressConfirmed, truckChoice } = useMove();
  const { tasks } = useChecklist();
  const { documents } = useDocuments();
  const { stats: routeStats } = useRouteStats();
  const { boxes } = useInventory();
  const [budgetTotals, setBudgetTotals] = useState({ totalEstimated: 0, totalActual: 0 });
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(CELEBRATE_KEY)) {
      sessionStorage.removeItem(CELEBRATE_KEY);
      setCelebrate(true);
    }
  }, []);

  useEffect(() => {
    async function loadBudget() {
      try {
        const res = await apiFetch("/api/budget");
        const json = (await res.json()) as { totalEstimated: number; totalActual: number };
        setBudgetTotals({
          totalEstimated: json.totalEstimated ?? 0,
          totalActual: json.totalActual ?? 0,
        });
      } catch {
        setBudgetTotals({ totalEstimated: 0, totalActual: 0 });
      }
    }
    void loadBudget();
    return subscribeProfileUpdated(() => void loadBudget());
  }, []);

  const daysLeft = daysUntil(profile.moveDate);
  const completed = tasks.filter((task) => task.status === "completed").length;
  const taskProgress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const pendingHigh = tasks.filter((t) => t.status !== "completed" && t.priority === "high").length;

  const gamification = useMemo(
    () =>
      calculateMoveScore({
        profile,
        tasks,
        documents,
        isAddressConfirmed,
        vehicleCount: vehicles.length,
        hasRouteCoords: hasRouteCoordinates(profile),
      }),
    [profile, tasks, documents, isAddressConfirmed, vehicles.length]
  );

  const alerts = useMemo(
    () =>
      generateAlerts({
        tasks,
        documents,
        totalEstimated: budgetTotals.totalEstimated,
        totalActual: budgetTotals.totalActual,
        budgetTarget: profile.budget,
        moveDate: profile.moveDate,
        daysUntilMove: daysLeft,
        distanceMiles: routeStats?.distanceMiles,
        driveTimeLabel: routeStats?.driveTimeLabel,
        pendingHighPriority: pendingHigh,
        pets: profile.pets,
        locale,
        truckChoice,
        boxCount: boxes.length,
        isAddressConfirmed,
      }),
    [
      tasks,
      documents,
      budgetTotals,
      profile.budget,
      profile.moveDate,
      profile.pets,
      daysLeft,
      routeStats,
      pendingHigh,
      locale,
      truckChoice,
      boxes.length,
      isAddressConfirmed,
    ]
  );

  return (
    <>
      <ConfettiBurst active={celebrate} />
      <DashboardHeader
        title={t("dashboard.title")}
        description={t("common.welcomeBack", { name: profile.name.split(" ")[0] })}
      />
      <PageContainer>
        <PendingInvitesBanner />
        <UpgradeProBanner />
        <GettingStartedCard />
        <JourneyNextCard />
        <PageHeader
          title={t("dashboardPage.overview")}
          description={t("dashboardPage.overviewDesc")}
        />

        <MoveCommandHero
          origin={profile.origin}
          destination={profile.destination}
          moveDate={profile.moveDate}
          daysLeft={daysLeft}
          distanceMiles={routeStats?.distanceMiles}
          driveTimeLabel={routeStats?.driveTimeLabel}
          gamification={gamification}
        />

        <MoveBadgesRow badges={gamification.badges} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("dashboardPage.estimatedBudget")}
            value={formatCurrency(profile.budget, locale)}
            subtext={t("dashboardPage.budgetTarget")}
            icon={DollarSign}
            glass
          />
          <StatCard
            label={t("dashboardPage.taskProgress")}
            value={`${taskProgress}%`}
            numericValue={taskProgress}
            numericSuffix="%"
            subtext={t("checklistPage.progressDesc", { completed, total: tasks.length })}
            icon={CheckCircle2}
            glass
          />
          <StatCard
            label={t("dashboardPage.priorityOpen")}
            value={String(pendingHigh)}
            numericValue={pendingHigh}
            subtext={t("dashboardPage.highPriorityTasks")}
            icon={TrendingUp}
            glass
          />
          <StatCard
            label={t("dashboardPage.daysUntilMove")}
            value={String(daysLeft)}
            numericValue={Math.max(0, daysLeft)}
            subtext={formatDate(profile.moveDate, locale)}
            icon={Calendar}
            glass
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 glass-card border-primary/10 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboardPage.taskProgress")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{t("checklistPage.overallProgress")}</span>
                  <span className="font-medium">
                    <CountUp value={taskProgress} suffix="%" />
                  </span>
                </div>
                <Progress value={taskProgress} className="h-3 transition-all duration-700" />
              </div>
            </CardContent>
          </Card>
          <NextActionCard />
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboardPage.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {QUICK_ACTION_KEYS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="w-full justify-between hover:border-primary/40 hover:bg-primary/5 transition-colors"
                asChild
              >
                <Link href={action.href}>
                  {t(action.labelKey)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <CollaboratorsDashboardCard />
        <DashboardInventoryCard />
        <DashboardHousingCard />
        <RouteWeatherPanel compact />
        <DashboardUtilitiesCard />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboardPage.alerts")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-3 rounded-lg border p-4 animate-fade-in hover:border-primary/20 transition-colors"
                >
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
                      <Badge variant="outline" className="text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <MoveActivityFeed />
        </div>
      </PageContainer>
    </>
  );
}
