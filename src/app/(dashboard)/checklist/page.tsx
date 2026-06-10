"use client";

import { useState } from "react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  PriorityBadge,
  TaskStatusBadge,
} from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHECKLIST_CATEGORIES } from "@/lib/constants";
import { CHECKLIST_TASKS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function ChecklistPage() {
  const [filter, setFilter] = useState("all");

  const completed = CHECKLIST_TASKS.filter((t) => t.status === "completed").length;
  const progress = Math.round((completed / CHECKLIST_TASKS.length) * 100);

  const filteredTasks =
    filter === "all"
      ? CHECKLIST_TASKS
      : CHECKLIST_TASKS.filter((t) => t.category === filter);

  return (
    <>
      <DashboardHeader title="Checklist" description="Track every moving task" />
      <PageContainer>
        <PageHeader
          title="Moving Checklist"
          description={`${completed} of ${CHECKLIST_TASKS.length} tasks complete`}
        />

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Overall progress</p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
              <Progress value={progress} className="w-full sm:w-64 h-3" />
            </div>
          </CardContent>
        </Card>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
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
                  {filter === "all" ? "All tasks" : filter}
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
                          Due {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={task.priority} />
                      <TaskStatusBadge status={task.status} />
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
