import type { DestinationUtilityProvider } from "@/lib/types";

const CATEGORY_ORDER: DestinationUtilityProvider["category"][] = [
  "electricity",
  "water",
  "gas",
  "fiber",
  "internet",
  "cable",
  "waste",
  "security",
];

export function getUtilityBestPicks(
  providers: DestinationUtilityProvider[]
): DestinationUtilityProvider[] {
  return providers
    .filter((p) => p.isBestPick && p.availableAtAddress)
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}

export function sumUtilityMonthlyEstimate(
  picks: Pick<DestinationUtilityProvider, "estimatedMonthlyPrice">[]
): number {
  return picks.reduce((sum, p) => sum + p.estimatedMonthlyPrice, 0);
}

export function formatUtilityPickPrice(
  pick: Pick<DestinationUtilityProvider, "estimatedMonthlyPrice" | "priceUnit">
): string {
  const unit = pick.priceUnit?.trim() || "/mo";
  return `$${pick.estimatedMonthlyPrice.toFixed(pick.estimatedMonthlyPrice % 1 ? 2 : 0)}${unit.startsWith("/") ? unit : ` ${unit}`}`;
}
