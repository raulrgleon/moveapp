import { Download, RefreshCw, Sparkles } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { PriorityBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AI_PLAN_NOTES,
  MOVING_PLAN_WEEKS,
  PLAN_PRIORITY_TASKS,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function MovingPlanPage() {
  return (
    <>
      <DashboardHeader title="Moving Plan" description="AI-generated week-by-week timeline" />
      <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
        <PageHeader
          title="AI Moving Plan"
          description="Personalized timeline for your Austin → Huntington move"
          action={
            <>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate plan
              </Button>
              <Button size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export plan
              </Button>
            </>
          }
        />

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-medium">AI-generated plan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on your move date of September 15, 2026, household of 2 adults, 1 child,
                and 1 dog, with a $4,000 budget and trailer rental preference.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold">Week-by-week timeline</h3>
            {MOVING_PLAN_WEEKS.map((week) => (
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
                        ? "Completed"
                        : week.status === "current"
                          ? "Current"
                          : "Upcoming"}
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
            ))}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Priority tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {PLAN_PRIORITY_TASKS.map((task) => (
                  <div key={task.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs text-muted-foreground">
                        Due {formatDate(task.due)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended next actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>1. Reserve U-Haul 6x12 trailer — availability tightening</p>
                <p>2. Book La Quinta Nashville — pet-friendly overnight</p>
                <p>3. Submit school enrollment by August 1</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AI_PLAN_NOTES.map((note, i) => (
                  <p key={i} className="text-sm text-muted-foreground">{note}</p>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
