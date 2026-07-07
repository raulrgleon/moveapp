/**
 * Links Amazon shopping products to supplies checklist items.
 * When all linked supply items are checked, the product is considered gathered.
 */
export const SHOPPING_TO_SUPPLY_IDS: Record<string, string[]> = {
  moving_boxes: ["boxesSmall", "boxesMedium", "boxesLarge"],
  packing_tape: ["packingTape"],
  bubble_wrap: ["bubbleWrap"],
  stretch_wrap: ["stretchWrap"],
  moving_blankets: ["furniturePads"],
  box_cutter: ["utilityKnife"],
  permanent_markers: ["markers"],
  mattress_bags: ["mattressBags"],
  furniture_sliders: ["furnitureSliders"],
  dolly_hand_truck: ["dolly"],
  tie_down_straps: ["movingStraps"],
  gloves: ["workGloves"],
};

export function isShoppingProductGathered(
  productId: string,
  supplyChecks: Record<string, boolean>
): boolean {
  const linked = SHOPPING_TO_SUPPLY_IDS[productId];
  if (!linked?.length) return false;
  return linked.every((id) => Boolean(supplyChecks[id]));
}

export function countGatheredShoppingProducts(
  supplyChecks: Record<string, boolean>
): { gathered: number; total: number } {
  const ids = Object.keys(SHOPPING_TO_SUPPLY_IDS);
  const gathered = ids.filter((id) => isShoppingProductGathered(id, supplyChecks)).length;
  return { gathered, total: ids.length };
}
