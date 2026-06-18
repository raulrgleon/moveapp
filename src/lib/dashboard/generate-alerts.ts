import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import type { AlertItem, ChecklistTask, DocumentItem } from "@/lib/types";

export interface GenerateAlertsInput {
  tasks: ChecklistTask[];
  documents: DocumentItem[];
  totalEstimated: number;
  totalActual: number;
  budgetTarget: number;
  moveDate?: string;
  daysUntilMove?: number;
  distanceMiles?: number;
  driveTimeLabel?: string;
  pendingHighPriority?: number;
  pets?: boolean;
  locale?: Locale;
  truckChoice?: string | null;
  boxCount?: number;
  isAddressConfirmed?: boolean;
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

  const days = input.daysUntilMove;
  if (days != null && days >= 0 && days <= 14) {
    alerts.push({
      id: "move-date-soon",
      type: days <= 7 ? "warning" : "info",
      title: t(locale, "dashboardPage.alertMoveSoonTitle"),
      message: t(locale, "dashboardPage.alertMoveSoonMessage", { days }),
    });
  }

  if ((input.pendingHighPriority ?? 0) > 0) {
    alerts.push({
      id: "high-priority",
      type: "info",
      title: t(locale, "dashboardPage.alertHighPriorityTitle"),
      message: t(locale, "dashboardPage.alertHighPriorityMessage", {
        count: input.pendingHighPriority ?? 0,
      }),
    });
  }

  if (input.distanceMiles != null && input.distanceMiles >= 800) {
    alerts.push({
      id: "long-route",
      type: "info",
      title: t(locale, "dashboardPage.alertLongRouteTitle"),
      message: t(locale, "dashboardPage.alertLongRouteMessage", {
        miles: input.distanceMiles,
        drive: input.driveTimeLabel ?? "",
      }),
    });
  }

  if (input.pets && input.distanceMiles != null && input.distanceMiles >= 400) {
    alerts.push({
      id: "pet-travel",
      type: "info",
      title: t(locale, "dashboardPage.alertPetTravelTitle"),
      message: t(locale, "dashboardPage.alertPetTravelMessage"),
    });
  }

  if (!input.truckChoice?.trim()) {
    alerts.push({
      id: "missing-truck",
      type: "info",
      title: t(locale, "dashboardPage.alertMissingTruckTitle"),
      message: t(locale, "dashboardPage.alertMissingTruckMessage"),
    });
  }

  if (!input.isAddressConfirmed) {
    alerts.push({
      id: "missing-address",
      type: "info",
      title: t(locale, "dashboardPage.alertMissingAddressTitle"),
      message: t(locale, "dashboardPage.alertMissingAddressMessage"),
    });
  }

  if ((input.boxCount ?? 0) >= 20) {
    alerts.push({
      id: "inventory-truck",
      type: "info",
      title: t(locale, "dashboardPage.alertInventoryTruckTitle"),
      message: t(locale, "dashboardPage.alertInventoryTruckMessage", {
        count: input.boxCount ?? 0,
      }),
    });
  }

  if (input.totalEstimated > input.budgetTarget && input.budgetTarget > 0) {
    alerts.push({
      id: "budget-estimate-over-target",
      type: "warning",
      title: t(locale, "dashboardPage.alertBudgetEstimateOverTargetTitle"),
      message: t(locale, "dashboardPage.alertBudgetEstimateOverTargetMessage"),
    });
  } else if (input.totalActual > input.budgetTarget && input.budgetTarget > 0) {
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

  return alerts.slice(0, 6);
}
