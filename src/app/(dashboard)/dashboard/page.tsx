import Link from "next/link";
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
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ALERTS,
  MOVE_STATS,
  QUICK_ACTIONS,
  MOCK_USER,
} from "@/lib/mock-data";
import { daysUntil, formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const daysLeft = daysUntil(MOCK_USER.moveDate);

  return (
    <>
      <DashboardHeader
        title="Dashboard"
        description={`Welcome back, ${MOCK_USER.name.split(" ")[0]}`}
      />
      <PageContainer>
        <PageHeader
          title="Move overview"
          description="Your relocation from Austin to Huntington at a glance"
        />

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moving route</p>
                  <p className="text-xl font-semibold">
                    {MOCK_USER.origin} → {MOCK_USER.destination}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Move date</p>
                  <p className="font-medium">{formatDate(MOCK_USER.moveDate)}</p>
                </div>
                <div className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                  <p className="text-xs opacity-80">Countdown</p>
                  <p className="text-2xl font-bold">{daysLeft} days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Estimated budget"
            value={formatCurrency(MOVE_STATS.estimatedTotalBudget)}
            subtext={`Target: ${formatCurrency(MOCK_USER.budget)}`}
            icon={DollarSign}
          />
          <StatCard
            label="Task progress"
            value={`${MOVE_STATS.taskCompletionPercent}%`}
            subtext="7 of 20 tasks complete"
            icon={CheckCircle2}
          />
          <StatCard
            label="Current phase"
            value={MOVE_STATS.currentPhase}
            subtext="Week 3 of 8"
            icon={TrendingUp}
          />
          <StatCard
            label="Days until move"
            value={`${daysLeft}`}
            subtext={formatDate(MOCK_USER.moveDate)}
            icon={Calendar}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall completion</span>
                  <span className="font-medium">{MOVE_STATS.taskCompletionPercent}%</span>
                </div>
                <Progress value={MOVE_STATS.taskCompletionPercent} className="h-3" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                {[
                  { label: "Planning", value: 65 },
                  { label: "Packing", value: 20 },
                  { label: "Travel prep", value: 45 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
        </div>

        <DashboardUtilitiesCard />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alerts & recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="flex gap-3 rounded-lg border p-4"
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
