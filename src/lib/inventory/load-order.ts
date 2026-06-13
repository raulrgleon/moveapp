import { effectiveWeightLbs, type InventoryBox } from "@/lib/inventory/types";

/** Lower score = load onto truck earlier (heavier / large first). Essentials load last. */
export function loadOrderScore(box: InventoryBox): number {
  let score = 0;
  if (box.essentials) score += 10_000;
  if (box.fragile) score += 2_000;
  if (box.sizeEstimate === "s") score += 400;
  if (box.sizeEstimate === "m") score += 200;
  score -= effectiveWeightLbs(box);
  return score;
}

export function sortBoxesForLoadOrder(boxes: InventoryBox[]): InventoryBox[] {
  return [...boxes].sort((a, b) => {
    const diff = loadOrderScore(a) - loadOrderScore(b);
    if (diff !== 0) return diff;
    return a.boxNumber - b.boxNumber;
  });
}

export function totalEstimatedWeightLbs(boxes: InventoryBox[]): number {
  return boxes.reduce((sum, b) => sum + effectiveWeightLbs(b), 0);
}
