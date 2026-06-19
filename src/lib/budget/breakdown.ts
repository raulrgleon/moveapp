import type { MoveProfile } from "@/lib/move-profile";
import { parseRentalPreferenceKey } from "@/lib/move-profile";
import type { BudgetEstimateContext } from "@/lib/budget/estimator";
import { estimateFuelCostSync } from "@/lib/budget/fuel-cost";
import { computeTruckOptionPrice, householdMultiplier, normalizedMoveMiles } from "@/lib/budget/pricing";
import { resolveTruckChoiceOption } from "@/lib/trucks/truck-choice";
import { truckOptionLabel } from "@/lib/trucks/truck-choice";
import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";

export interface BudgetLineBreakdown {
  category: string;
  lines: string[];
}

export function buildBudgetBreakdowns(
  profile: MoveProfile,
  items: { category: string; estimated: number; cheapestOption?: string | null }[],
  context: BudgetEstimateContext = {}
): BudgetLineBreakdown[] {
  const miles = normalizedMoveMiles(context.distanceMiles ?? 800);
  const mult = householdMultiplier(profile.household);
  const vehicles = context.vehicles ?? [];
  const locale: Locale = context.locale ?? "en";
  const t = (key: string, p?: Record<string, string | number>) => translate(locale, key, p);

  return items.map((item) => {
    const lines: string[] = [];
    const cat = item.category.toLowerCase();

    if (cat.includes("fuel")) {
      const fuel = estimateFuelCostSync({
        distanceMiles: miles,
        vehicles,
        vehicleCount: Math.max(1, vehicles.length),
        rentalKey: parseRentalPreferenceKey(profile.rentalPreference),
        origin: profile.origin,
        destination: profile.destination,
        locale,
      });
      lines.push(t("budgetNotes.breakdown.distance", { miles: miles.toLocaleString(locale === "es" ? "es-US" : "en-US") }));
      if (fuel.vehicleLines.length > 1) {
        for (const line of fuel.vehicleLines) {
          if (line.isElectric) {
            lines.push(
              t("budgetNotes.breakdown.evLine", {
                vehicle: line.vehicleLabel,
                kwh: line.kwh,
                mpge: line.mpg,
              })
            );
          } else {
            lines.push(
              t("budgetNotes.breakdown.gasLine", {
                vehicle: line.vehicleLabel,
                gallons: line.gallons,
                mpg: line.mpg,
              })
            );
          }
        }
      } else {
        lines.push(t("budgetNotes.breakdown.avgMpg", { mpg: fuel.mpg }));
      }
      lines.push(t("budgetNotes.breakdown.fuelPrice", { price: fuel.pricePerGallon.toFixed(2) }));
      lines.push(t("budgetNotes.breakdown.gallons", { gallons: fuel.gallons }));
      lines.push(t("budgetNotes.breakdown.fuelFormula"));
    } else if (cat.includes("rental") || cat.includes("trailer") || cat.includes("truck")) {
      const saved = context.truckChoice
        ? resolveTruckChoiceOption(profile, context.truckChoice, miles, locale, vehicles)
        : null;
      if (saved) {
        lines.push(t("budgetNotes.breakdown.savedChoice", { choice: truckOptionLabel(saved) }));
        lines.push(t("budgetNotes.breakdown.baseMileage", { mult: mult.toFixed(2) }));
      } else if (item.cheapestOption) {
        lines.push(t("budgetNotes.breakdown.preference", { preference: item.cheapestOption }));
      }
      lines.push(t("budgetNotes.breakdown.distance", { miles: miles.toLocaleString(locale === "es" ? "es-US" : "en-US") }));
    } else if (cat.includes("hotel")) {
      lines.push(t("budgetNotes.breakdown.hotelStops"));
      lines.push(t("budgetNotes.breakdown.hotelFormula"));
    } else if (cat.includes("vehicle") && cat.includes("transport")) {
      lines.push(
        t("budgetNotes.breakdown.shipOption", {
          choice: context.vehicleTransportChoice ?? "—",
        })
      );
      lines.push(t("budgetNotes.breakdown.distance", { miles: miles.toLocaleString(locale === "es" ? "es-US" : "en-US") }));
    } else if (cat.includes("supplies")) {
      lines.push(t("budgetNotes.breakdown.householdMult", { mult: mult.toFixed(2) }));
    } else {
      lines.push(t("budgetNotes.breakdown.generic", { miles }));
    }

    return { category: item.category, lines };
  });
}
