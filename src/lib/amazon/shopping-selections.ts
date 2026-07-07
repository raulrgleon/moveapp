export interface ShoppingSelectionRecord {
  id: string;
  quantity: number;
  selected: boolean;
}

export type ShoppingSelectionsMap = Record<string, ShoppingSelectionRecord>;

export function sanitizeShoppingSelections(input: unknown): ShoppingSelectionRecord[] {
  if (!Array.isArray(input)) return [];
  const out: ShoppingSelectionRecord[] = [];
  for (const row of input) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    if (!id) continue;
    const quantity = Number(r.quantity);
    out.push({
      id,
      quantity: Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1,
      selected: Boolean(r.selected),
    });
  }
  return out;
}

export function selectionsToMap(items: ShoppingSelectionRecord[]): ShoppingSelectionsMap {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}
