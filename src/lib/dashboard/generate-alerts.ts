import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import type { AlertItem, ChecklistTask, DocumentItem } from "@/lib/types";

export interface GenerateAlertsInput {
  tasks: ChecklistTask[];
  documents: DocumentItem[];
  totalEstimated: number;
  totalActual: number;
  budgetTarget: number;
  locale?: Locale;
}

function t(locale: Locale, key: string, params?: Record<string, string | number>) {
  return translate(locale, key, params);
}

export function generateAlerts(input: GenerateAlertsInput): AlertItem[] {
  const locale = input.locale ?? "en";
  const alerts: AlertItem[] = [];
  const today = new Date().toISOString().slice(0, 10);

  const overdue = input.tasks.filter(
    (task) => task.status !== "completed" && task.dueDate && task.dueDate < today
  );
  if (overdue.length > 0) {
    alerts.push({
      id: "overdue-tasks",
      type: "warning",
      title: t(locale, "dashboardPage.alertOverdueTitle"),
      message: t(locale, "dashboardPage.alertOverdueMessage", { count: overdue.length }),
    });
  }

  if (input.totalActual > input.budgetTarget) {
    alerts.push({
      id: "budget-target",
      type: "warning",
      title: t(locale, "dashboardPage.alertBudgetTargetTitle"),
      message: t(locale, "dashboardPage.alertBudgetTargetMessage"),
    });
  } else if (input.totalActual > input.totalEstimated && input.totalActual > 0) {
    alerts.push({
      id: "budget-estimate",
      type: "info",
      title: t(locale, "dashboardPage.alertBudgetEstimateTitle"),
      message: t(locale, "dashboardPage.alertBudgetEstimateMessage"),
    });
  }

  const missing = input.documents.filter((d) => d.status === "missing");
  if (missing.length > 0) {
    alerts.push({
      id: "missing-docs",
      type: "warning",
      title: t(locale, "dashboardPage.alertDocsTitle"),
      message: t(locale, "dashboardPage.alertDocsMessage", { count: missing.length }),
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-good",
      type: "success",
      title: t(locale, "dashboardPage.alertAllGoodTitle"),
      message: t(locale, "dashboardPage.alertAllGoodMessage"),
    });
  }

  return alerts;
}
