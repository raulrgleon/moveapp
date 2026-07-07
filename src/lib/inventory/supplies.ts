export type SupplyCategory = "packing" | "protection" | "tools" | "moveDay";

export interface SupplyItemDef {
  id: string;
  category: SupplyCategory;
  qty: { small: number; medium: number; large: number };
}

export interface HouseholdSize {
  adults: number;
  children: number;
  tier: "small" | "medium" | "large";
}

export const PACKING_SUPPLIES_TASK_TITLES = [
  "Order packing supplies",
  "Pedir materiales de empaque",
] as const;

export const SUPPLY_ITEMS: SupplyItemDef[] = [
  { id: "boxesSmall", category: "packing", qty: { small: 5, medium: 8, large: 12 } },
  { id: "boxesMedium", category: "packing", qty: { small: 8, medium: 15, large: 25 } },
  { id: "boxesLarge", category: "packing", qty: { small: 3, medium: 6, large: 10 } },
  { id: "packingTape", category: "packing", qty: { small: 2, medium: 4, large: 6 } },
  { id: "bubbleWrap", category: "packing", qty: { small: 1, medium: 2, large: 3 } },
  { id: "packingPaper", category: "packing", qty: { small: 1, medium: 2, large: 3 } },
  { id: "markers", category: "packing", qty: { small: 2, medium: 3, large: 4 } },
  { id: "labels", category: "packing", qty: { small: 1, medium: 2, large: 2 } },
  { id: "stretchWrap", category: "packing", qty: { small: 1, medium: 1, large: 2 } },
  { id: "furniturePads", category: "protection", qty: { small: 4, medium: 8, large: 12 } },
  { id: "furnitureSliders", category: "protection", qty: { small: 4, medium: 8, large: 12 } },
  { id: "cornerGuards", category: "protection", qty: { small: 4, medium: 8, large: 12 } },
  { id: "mattressBags", category: "protection", qty: { small: 1, medium: 2, large: 3 } },
  { id: "screwdriverSet", category: "tools", qty: { small: 1, medium: 1, large: 1 } },
  { id: "utilityKnife", category: "tools", qty: { small: 1, medium: 2, large: 2 } },
  { id: "toolboxBasics", category: "tools", qty: { small: 1, medium: 1, large: 1 } },
  { id: "dolly", category: "moveDay", qty: { small: 1, medium: 1, large: 2 } },
  { id: "movingStraps", category: "moveDay", qty: { small: 2, medium: 4, large: 6 } },
  { id: "workGloves", category: "moveDay", qty: { small: 1, medium: 2, large: 4 } },
  { id: "cleaningKit", category: "moveDay", qty: { small: 1, medium: 1, large: 1 } },
];

export const SUPPLY_CATEGORIES: SupplyCategory[] = [
  "packing",
  "protection",
  "tools",
  "moveDay",
];

export function parseHousehold(household: string): HouseholdSize {
  const text = household.toLowerCase();
  const adultMatch = text.match(/(\d+)\s*(adult|adults|adulto|adultos)/);
  const childMatch = text.match(/(\d+)\s*(child|children|niño|niños|nino|ninos)/);
  const adults = adultMatch ? Number(adultMatch[1]) : 1;
  const children = childMatch ? Number(childMatch[1]) : 0;
  const total = adults + children;

  let tier: HouseholdSize["tier"] = "medium";
  if (total <= 1) tier = "small";
  else if (total >= 4) tier = "large";

  return { adults: Math.max(adults, 1), children, tier };
}

export function getSupplyQuantity(item: SupplyItemDef, household: HouseholdSize): number {
  return item.qty[household.tier];
}

export function isPackingSuppliesTask(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  return PACKING_SUPPLIES_TASK_TITLES.some((t) => t.toLowerCase() === normalized);
}

export function suppliesProgress(
  checked: Record<string, boolean>,
  items: SupplyItemDef[] = SUPPLY_ITEMS
): { done: number; total: number; percent: number } {
  const total = items.length;
  const done = items.filter((item) => checked[item.id]).length;
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}
