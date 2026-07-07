/**
 * Manual moving-supplies catalog.
 *
 * IMPORTANT:
 * - Do not scrape Amazon pages.
 * - Do not crawl Amazon search results.
 * - Do not fake product data from Amazon.
 * - Use manual ASIN assignment from admin configuration only.
 */
export type MovingPresetKey = "studio" | "two_bed" | "three_bed" | "four_plus";

export interface ShoppingProductDef {
  id: string;
  /** i18n key under amazonShopping.products.{id} */
  nameKey: string;
  descriptionKey: string;
  estimatedPrice: number;
  defaultAsin?: string;
}

export const MOVING_PRODUCTS: ShoppingProductDef[] = [
  {
    id: "moving_boxes",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 65,
  },
  {
    id: "packing_tape",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 22,
  },
  {
    id: "bubble_wrap",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 28,
  },
  {
    id: "stretch_wrap",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 20,
  },
  {
    id: "moving_blankets",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 45,
  },
  {
    id: "box_cutter",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 12,
  },
  {
    id: "permanent_markers",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 10,
  },
  {
    id: "mattress_bags",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 24,
  },
  {
    id: "furniture_sliders",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 18,
  },
  {
    id: "dolly_hand_truck",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 79,
  },
  {
    id: "tie_down_straps",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 19,
  },
  {
    id: "gloves",
    nameKey: "name",
    descriptionKey: "description",
    estimatedPrice: 15,
  },
];

export const PRESET_LABELS: Record<MovingPresetKey, string> = {
  studio: "studio",
  two_bed: "two_bed",
  three_bed: "three_bed",
  four_plus: "four_plus",
};

export const PRESET_QUANTITIES: Record<MovingPresetKey, Record<string, number>> = {
  studio: {
    moving_boxes: 20,
    packing_tape: 6,
    bubble_wrap: 2,
    stretch_wrap: 1,
    moving_blankets: 4,
    box_cutter: 1,
    permanent_markers: 2,
    mattress_bags: 1,
    furniture_sliders: 1,
    dolly_hand_truck: 1,
    tie_down_straps: 2,
    gloves: 2,
  },
  two_bed: {
    moving_boxes: 35,
    packing_tape: 10,
    bubble_wrap: 4,
    stretch_wrap: 2,
    moving_blankets: 8,
    box_cutter: 1,
    permanent_markers: 3,
    mattress_bags: 2,
    furniture_sliders: 1,
    dolly_hand_truck: 1,
    tie_down_straps: 4,
    gloves: 3,
  },
  three_bed: {
    moving_boxes: 50,
    packing_tape: 14,
    bubble_wrap: 6,
    stretch_wrap: 3,
    moving_blankets: 12,
    box_cutter: 2,
    permanent_markers: 4,
    mattress_bags: 3,
    furniture_sliders: 2,
    dolly_hand_truck: 1,
    tie_down_straps: 6,
    gloves: 4,
  },
  four_plus: {
    moving_boxes: 70,
    packing_tape: 20,
    bubble_wrap: 8,
    stretch_wrap: 4,
    moving_blankets: 16,
    box_cutter: 2,
    permanent_markers: 5,
    mattress_bags: 4,
    furniture_sliders: 2,
    dolly_hand_truck: 2,
    tie_down_straps: 8,
    gloves: 5,
  },
};
