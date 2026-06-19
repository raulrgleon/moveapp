"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Plus, Trash2, CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { useChecklist } from "@/contexts/checklist-context";
import { useMove } from "@/contexts/move-context";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TaskAssigneeField } from "@/components/collaboration/task-assignee-field";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHECKLIST_CATEGORIES } from "@/lib/constants";
import { isPackingSuppliesTask } from "@/lib/inventory/supplies";
import type { ChecklistTask, TaskPriority, TaskStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const ALL_CATEGORIES = ["Planning", ...CHECKLIST_CATEGORIES] as const;

function orderedTabCategories(tasks: ChecklistTask[]): string[] {
  const known = new Set<string>(ALL_CATEGORIES);
  const extras = Array.from(new Set(tasks.map((task) => task.category))).filter(
    (cat) => cat && !known.has(cat)
  );
  return [...ALL_CATEGORIES, ...extras];
}

function categoryLabel(t: (key: string) => string, category: string) {
  const key = `checklistCategories.${category}`;
  const translated = t(key);
  return translated === key ? category : translated;
}

export default function ChecklistPage() {
  const t = useT();
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const { canEdit } = useMove();
  const { tasks, setTaskStatus, addTask, deleteTask, updateTask } = useChecklist();
  const [filter, setFilter] = useState("all");
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [notesTaskId, setNotesTaskId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    category: "Planning",
    dueDate: "",
    priority: "medium" as TaskPriority,
    assigneeEmail: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [popTaskId, setPopTaskId] = useState<string | null>(null);

  const handleToggleComplete = (taskId: string, current: TaskStatus) => {
    const next: TaskStatus = current === "completed" ? "pending" : "completed";
    void setTaskStatus(taskId, next);
    if (next === "completed") {
      setPopTaskId(taskId);
      window.setTimeout(() => setPopTaskId(null), 400);
    }
  };

  const completed = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const tabCategories = useMemo(() => orderedTabCategories(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    let list = filter === "all" ? tasks : tasks.filter((task) => task.category === filter);
    if (dueDateFilter) {
      list = list.filter((task) => task.dueDate === dueDateFilter);
    }
    return list;
  }, [tasks, filter, dueDateFilter]);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category && tabCategories.includes(category)) {
      setFilter(category);
    }
  }, [searchParams, tabCategories]);

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId) return;
    setHighlightTaskId(taskId);
    const el = document.getElementById(`checklist-task-${taskId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timer = setTimeout(() => setHighlightTaskId(null), 5000);
    return () => clearTimeout(timer);
  }, [searchParams, tasks]);

  const openNotes = (task: ChecklistTask) => {
    setNotesTaskId(task.id);
    setNotesDraft(task.notes ?? "");
  };

  const saveNotes = async () => {
    if (!notesTaskId) return;
    setSaving(true);
    try {
      await updateTask(notesTaskId, { notes: notesDraft });
      setNotesTaskId(null);
    } finally {
      setSaving(false);
    }
  };

  const submitNewTask = async () => {
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      await addTask({
        title: newTask.title.trim(),
        category: newTask.category,
        status: "pending",
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        assigneeEmail: newTask.assigneeEmail.trim() || undefined,
        notes: newTask.notes.trim() || undefined,
      });
      setNewTask({
        title: "",
        category: "Planning",
        dueDate: "",
        priority: "medium",
        assigneeEmail: "",
        notes: "",
      });
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DashboardHeader title={t("checklistPage.title")} description={t("checklistPage.subtitle")} />
      <PageContainer>
        <PageHeader
          action={
            canEdit ? (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("checklistPage.addTask")}
              </Button>
            ) : undefined
          }
        />

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("checklistPage.overallProgress")}</p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
              <Progress value={progress} className="w-full sm:w-64 h-3" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="space-y-2 flex-1">
                <Label htmlFor="due-filter">{t("checklistPage.filterByDate")}</Label>
                <Input
                  id="due-filter"
                  type="date"
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value)}
                />
              </div>
              {dueDateFilter && (
                <Button variant="outline" onClick={() => setDueDateFilter("")}>
                  {t("checklistPage.clearDateFilter")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex h-auto w-full overflow-x-auto flex-nowrap justify-start gap-1 pb-1">
            <TabsTrigger value="all">{t("checklistPage.all")}</TabsTrigger>
            {tabCategories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {categoryLabel(t, cat)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {filter === "all"
                    ? t("checklistPage.allTasks")
                    : categoryLabel(t, filter)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    emoji="✅"
                    title={t("checklistPage.noTasksTitle")}
                    description={t("checklistPage.noTasksDesc")}
                    actionLabel={canEdit ? t("checklistPage.addTask") : undefined}
                    onAction={canEdit ? () => setAddOpen(true) : undefined}
                    className="py-10"
                  />
                ) : filteredTasks.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    emoji="🔍"
                    title={
                      dueDateFilter
                        ? t("checklistPage.noTasksForDate")
                        : t("checklistPage.noFilterResultsTitle")
                    }
                    description={t("checklistPage.noFilterResultsDesc")}
                    actionLabel={dueDateFilter ? t("checklistPage.clearDateFilter") : t("checklistPage.all")}
                    onAction={() => {
                      if (dueDateFilter) setDueDateFilter("");
                      else setFilter("all");
                    }}
                    className="py-10"
                  />
                ) : null}
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    id={`checklist-task-${task.id}`}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-lg border p-4 transition-colors",
                      highlightTaskId === task.id && "border-primary bg-primary/5 ring-1 ring-primary/30",
                      popTaskId === task.id && "task-complete-pop border-emerald-500/40 bg-emerald-500/5",
                      task.status === "completed" && "opacity-75"
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {canEdit ? (
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => handleToggleComplete(task.id, task.status)}
                          aria-label={
                            task.status === "completed"
                              ? t("checklistPage.markPending")
                              : t("checklistPage.markComplete")
                          }
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                      ) : null}
                      <div className="space-y-2 flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-medium text-sm",
                            task.status === "completed" && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{categoryLabel(t, task.category)}</Badge>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {t("checklistPage.due", { date: formatDate(task.dueDate, locale) })}
                          </span>
                        )}
                        {task.assigneeEmail && (
                          <span className="text-xs text-muted-foreground">{task.assigneeEmail}</span>
                        )}
                      </div>
                      {task.notes && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{task.notes}</p>
                      )}
                      {isPackingSuppliesTask(task.title) && (
                        <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                          <Link href="/inventory?tab=supplies">
                            {t("movingSupplies.checklistTaskLink")}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 sm:pl-0 pl-8">
                      <PriorityBadge priority={task.priority} />
                      <TaskStatusBadge status={task.status} />
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openNotes(task)}>
                            {t("checklistPage.editNotes")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTask(task.id)}
                            aria-label={t("checklistPage.deleteTask")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("checklistPage.addTaskTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("checklistPage.taskTitle")}</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("checklistPage.taskCategory")}</Label>
                <Select
                  value={newTask.category}
                  onValueChange={(v) => setNewTask((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tabCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabel(t, cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("checklistPage.taskDueDate")}</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <TaskAssigneeField
              value={newTask.assigneeEmail}
              onChange={(email) => setNewTask((p) => ({ ...p, assigneeEmail: email }))}
            />
            <div className="space-y-2">
              <Label>{t("checklistPage.taskNotes")}</Label>
              <Textarea
                value={newTask.notes}
                onChange={(e) => setNewTask((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitNewTask} disabled={saving || !newTask.title.trim()}>
              {saving ? t("common.saving") : t("checklistPage.addTask")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(notesTaskId)} onOpenChange={(open) => !open && setNotesTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("checklistPage.editNotes")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesTaskId(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveNotes} disabled={saving}>
              {saving ? t("common.saving") : t("checklistPage.saveNotes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
