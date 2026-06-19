import { normalizeUsState } from "@/lib/geo/address-region";
import type { ResolvedLocation } from "@/lib/geo/resolve-location";
import { compareValues } from "@/lib/comparison/trend";
import type { ComparisonDirection, HousingTrend } from "@/lib/rentcast/types";
import {
  METRO_GROCERY_PREMIUM,
  STATE_GAS_PRICE,
  STATE_GROCERY_INDEX,
  US_AVG_GAS_PRICE,
  US_AVG_GROCERY_INDEX,
} from "@/lib/cost-of-living/state-data";

/** National Walmart Great Value baseline prices (USD, approximate). */
export const NATIONAL_WALMART_BASE = {
  milk_gallon: 3.42,
  eggs_dozen: 2.86,
  bread_loaf: 1.67,
  ground_beef_lb: 5.24,
  chicken_breast_lb: 3.64,
  bananas_lb: 0.58,
  coffee_12oz: 7.48,
  cereal_18oz: 3.97,
  bottled_water_24: 4.28,
} as const;

export type EssentialsItemKey = keyof typeof NATIONAL_WALMART_BASE | "gas_gallon";

export interface EssentialsItem {
  key: EssentialsItemKey;
  labelKey: string;
  unitKey: string;
  price: number;
  store: "walmart" | "market";
}

export interface EssentialsSummary {
  label: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  groceryIndex: number;
  items: EssentialsItem[];
  weeklyBasketTotal: number;
  monthlyGroceriesEstimate: number;
}

export interface EssentialsComparisonMetric {
  key: string;
  labelKey: string;
  unitKey: string;
  originValue: string;
  destinationValue: string;
  originPrice: number;
  destinationPrice: number;
  trend: HousingTrend;
  direction: ComparisonDirection;
}

const ESSENTIALS_CATALOG: { key: EssentialsItemKey; labelKey: string; unitKey: string; baseKey?: keyof typeof NATIONAL_WALMART_BASE }[] = [
  { key: "milk_gallon", labelKey: "cityComparison.essentials.milk", unitKey: "cityComparison.essentials.unit.gallon" },
  { key: "eggs_dozen", labelKey: "cityComparison.essentials.eggs", unitKey: "cityComparison.essentials.unit.dozen" },
  { key: "bread_loaf", labelKey: "cityComparison.essentials.bread", unitKey: "cityComparison.essentials.unit.loaf" },
  { key: "ground_beef_lb", labelKey: "cityComparison.essentials.groundBeef", unitKey: "cityComparison.essentials.unit.lb" },
  { key: "chicken_breast_lb", labelKey: "cityComparison.essentials.chicken", unitKey: "cityComparison.essentials.unit.lb" },
  { key: "bananas_lb", labelKey: "cityComparison.essentials.bananas", unitKey: "cityComparison.essentials.unit.lb" },
  { key: "coffee_12oz", labelKey: "cityComparison.essentials.coffee", unitKey: "cityComparison.essentials.unit.bag" },
  { key: "cereal_18oz", labelKey: "cityComparison.essentials.cereal", unitKey: "cityComparison.essentials.unit.box" },
  { key: "bottled_water_24", labelKey: "cityComparison.essentials.water", unitKey: "cityComparison.essentials.unit.case" },
  { key: "gas_gallon", labelKey: "cityComparison.essentials.gas", unitKey: "cityComparison.essentials.unit.gallon" },
];

/** Weekly basket quantities for a rough household estimate. */
const WEEKLY_BASKET: Partial<Record<EssentialsItemKey, number>> = {
  milk_gallon: 2,
  eggs_dozen: 2,
  bread_loaf: 2,
  ground_beef_lb: 2,
  chicken_breast_lb: 2,
  bananas_lb: 3,
  coffee_12oz: 0.25,
  cereal_18oz: 0.5,
  bottled_water_24: 0.5,
};

function metroMultiplier(city: string | null): number {
  if (!city) return 1;
  const normalized = city.toLowerCase().trim();
  for (const [name, mult] of Object.entries(METRO_GROCERY_PREMIUM)) {
    if (normalized.includes(name) || name.includes(normalized)) return mult;
  }
  return 1;
}

function groceryIndexForLocation(location: ResolvedLocation): number {
  const state = normalizeUsState(location.state);
  const stateIndex = state ? (STATE_GROCERY_INDEX[state] ?? US_AVG_GROCERY_INDEX) : US_AVG_GROCERY_INDEX;
  return stateIndex * metroMultiplier(location.city);
}

function gasPriceForLocation(location: ResolvedLocation): number {
  const state = normalizeUsState(location.state);
  return state ? (STATE_GAS_PRICE[state] ?? US_AVG_GAS_PRICE) : US_AVG_GAS_PRICE;
}

function fmtPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function compareEssentials(originNum: number, destNum: number, lowerIsBetter: boolean) {
  return compareValues(originNum, destNum, lowerIsBetter, {
    thresholdRatio: 0.03,
    minThreshold: 0.05,
  });
}

export function buildEssentialsSummary(location: ResolvedLocation): EssentialsSummary {
  const groceryIndex = groceryIndexForLocation(location);
  const gasPrice = gasPriceForLocation(location);

  const items: EssentialsItem[] = ESSENTIALS_CATALOG.map((item) => {
    if (item.key === "gas_gallon") {
      return {
        key: item.key,
        labelKey: item.labelKey,
        unitKey: item.unitKey,
        price: gasPrice,
        store: "market",
      };
    }
    const base = NATIONAL_WALMART_BASE[item.key as keyof typeof NATIONAL_WALMART_BASE];
    return {
      key: item.key,
      labelKey: item.labelKey,
      unitKey: item.unitKey,
      price: Math.round(base * groceryIndex * 100) / 100,
      store: "walmart",
    };
  });

  let weeklyBasketTotal = 0;
  for (const item of items) {
    if (item.key === "gas_gallon") continue;
    const qty = WEEKLY_BASKET[item.key] ?? 0;
    weeklyBasketTotal += item.price * qty;
  }

  return {
    label: location.label,
    city: location.city,
    state: location.state,
    zipCode: location.zipCode,
    groceryIndex,
    items,
    weeklyBasketTotal: Math.round(weeklyBasketTotal * 100) / 100,
    monthlyGroceriesEstimate: Math.round(weeklyBasketTotal * 4.33 * 100) / 100,
  };
}

export function buildEssentialsComparisonMetrics(
  origin: EssentialsSummary,
  destination: EssentialsSummary
): EssentialsComparisonMetric[] {
  const originMap = new Map(origin.items.map((i) => [i.key, i]));
  const destMap = new Map(destination.items.map((i) => [i.key, i]));

  const metrics: EssentialsComparisonMetric[] = [];

  for (const item of ESSENTIALS_CATALOG) {
    const o = originMap.get(item.key);
    const d = destMap.get(item.key);
    if (!o || !d) continue;
    const { trend, direction } = compareEssentials(o.price, d.price, true);
    metrics.push({
      key: item.key,
      labelKey: item.labelKey,
      unitKey: item.unitKey,
      originValue: fmtPrice(o.price),
      destinationValue: fmtPrice(d.price),
      originPrice: o.price,
      destinationPrice: d.price,
      trend,
      direction,
    });
  }

  const weeklyCompare = compareEssentials(
    origin.weeklyBasketTotal,
    destination.weeklyBasketTotal,
    true
  );
  metrics.push({
    key: "weekly_basket",
    labelKey: "cityComparison.essentials.weeklyBasket",
    unitKey: "cityComparison.essentials.unit.week",
    originValue: fmtPrice(origin.weeklyBasketTotal),
    destinationValue: fmtPrice(destination.weeklyBasketTotal),
    originPrice: origin.weeklyBasketTotal,
    destinationPrice: destination.weeklyBasketTotal,
    trend: weeklyCompare.trend,
    direction: weeklyCompare.direction,
  });

  const monthlyCompare = compareEssentials(
    origin.monthlyGroceriesEstimate,
    destination.monthlyGroceriesEstimate,
    true
  );
  metrics.push({
    key: "monthly_groceries",
    labelKey: "cityComparison.essentials.monthlyGroceries",
    unitKey: "cityComparison.essentials.unit.month",
    originValue: fmtPrice(origin.monthlyGroceriesEstimate),
    destinationValue: fmtPrice(destination.monthlyGroceriesEstimate),
    originPrice: origin.monthlyGroceriesEstimate,
    destinationPrice: destination.monthlyGroceriesEstimate,
    trend: monthlyCompare.trend,
    direction: monthlyCompare.direction,
  });

  return metrics;
}
