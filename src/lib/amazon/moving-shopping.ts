/**
 * Manual moving-supplies catalog.
 *
 * IMPORTANT:
 * - Do not scrape Amazon pages.
 * - Do not crawl Amazon search results.
 * - Do not fake product data from Amazon.
 * - Use manual ASIN assignment (admin config or user-entered ASINs).
 */
export type MovingPresetKey = "studio" | "two_bed" | "three_bed" | "four_plus";

export interface ShoppingProductDef {
  id: string;
  name: string;
  description: string;
  estimatedPrice: number;
  defaultAsin?: string;
}

export const MOVING_PRODUCTS: ShoppingProductDef[] = [
  {
    id: "moving_boxes",
    name: "Moving boxes",
    description: "Mixed-size cardboard boxes for packing rooms.",
    estimatedPrice: 65,
  },
  {
    id: "packing_tape",
    name: "Packing tape",
    description: "Heavy-duty tape rolls for sealing boxes.",
    estimatedPrice: 22,
  },
  {
    id: "bubble_wrap",
    name: "Bubble wrap",
    description: "Cushioning wrap for fragile items and electronics.",
    estimatedPrice: 28,
  },
  {
    id: "stretch_wrap",
    name: "Stretch wrap",
    description: "Plastic wrap for securing drawers and grouped items.",
    estimatedPrice: 20,
  },
  {
    id: "moving_blankets",
    name: "Moving blankets",
    description: "Protective blankets for furniture and appliances.",
    estimatedPrice: 45,
  },
  {
    id: "box_cutter",
    name: "Box cutter",
    description: "Utility knife for opening boxes and cutting tape.",
    estimatedPrice: 12,
  },
  {
    id: "permanent_markers",
    name: "Permanent markers",
    description: "Markers to label box contents and destination rooms.",
    estimatedPrice: 10,
  },
  {
    id: "mattress_bags",
    name: "Mattress bags",
    description: "Plastic bags to protect mattresses during transport.",
    estimatedPrice: 24,
  },
  {
    id: "furniture_sliders",
    name: "Furniture sliders",
    description: "Floor sliders to move heavy furniture with less effort.",
    estimatedPrice: 18,
  },
  {
    id: "dolly_hand_truck",
    name: "Dolly / hand truck",
    description: "Rolling dolly to move boxes and heavy items safely.",
    estimatedPrice: 79,
  },
  {
    id: "tie_down_straps",
    name: "Tie-down straps",
    description: "Ratchet or cam straps to secure items in truck/trailer.",
    estimatedPrice: 19,
  },
  {
    id: "gloves",
    name: "Gloves",
    description: "Work gloves for grip and hand protection.",
    estimatedPrice: 15,
  },
];

export const PRESET_LABELS: Record<MovingPresetKey, string> = {
  studio: "Studio / 1 bedroom",
  two_bed: "2 bedrooms",
  three_bed: "3 bedrooms",
  four_plus: "4+ bedrooms",
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
