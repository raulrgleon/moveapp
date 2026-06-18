import type { BudgetEstimateLine } from "@/lib/budget/estimator";

export interface BudgetItemRow {
  id: string;
  category: string;
  estimated: number;
  actual: number;
  cheapestOption?: string | null;
  sortOrder: number;
}

/** Merge persisted budget rows with live estimates (keeps user-entered actuals). */
export function mergeLiveBudgetItems(
  dbItems: BudgetItemRow[],
  liveItems: BudgetEstimateLine[]
): BudgetItemRow[] {
  const byCategory = new Map(dbItems.map((row) => [row.category, row]));
  const merged: BudgetItemRow[] = [];

  for (const live of liveItems) {
    const existing = byCategory.get(live.category);
    if (existing) {
      merged.push({
        ...existing,
        estimated: live.estimated,
        cheapestOption: live.cheapestOption ?? existing.cheapestOption,
        sortOrder: live.sortOrder,
      });
      byCategory.delete(live.category);
    } else {
      merged.push({
        id: `live-${live.category.replace(/\s+/g, "-").toLowerCase()}`,
        category: live.category,
        estimated: live.estimated,
        actual: 0,
        cheapestOption: live.cheapestOption ?? null,
        sortOrder: live.sortOrder,
      });
    }
  }

  for (const orphan of Array.from(byCategory.values())) {
    merged.push(orphan);
  }

  return merged.sort((a, b) => a.sortOrder - b.sortOrder);
}
