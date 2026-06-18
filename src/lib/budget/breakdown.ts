import type { MoveProfile } from "@/lib/move-profile";
import { parseRentalPreferenceKey } from "@/lib/move-profile";
import type { BudgetEstimateContext } from "@/lib/budget/estimator";
import { estimateFuelCostSync } from "@/lib/budget/fuel-cost";
import { computeTruckOptionPrice, householdMultiplier, normalizedMoveMiles } from "@/lib/budget/pricing";
import { resolveTruckChoiceOption } from "@/lib/trucks/truck-choice";
import { truckOptionLabel } from "@/lib/trucks/truck-choice";

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
      });
      lines.push(`Distance: ${miles.toLocaleString()} mi`);
      if (fuel.vehicleLines.length > 1) {
        for (const line of fuel.vehicleLines) {
          if (line.isElectric) {
            lines.push(`${line.vehicleLabel}: ~${line.kwh} kWh (${line.mpg} MPGe)`);
          } else {
            lines.push(`${line.vehicleLabel}: ~${line.gallons} gal @ ${line.mpg} MPG`);
          }
        }
      } else {
        lines.push(`Avg MPG: ${fuel.mpg}`);
      }
      lines.push(`Fuel price: $${fuel.pricePerGallon.toFixed(2)}/gal`);
      lines.push(`Gallons: ~${fuel.gallons}`);
      lines.push(`Formula: sum per vehicle (miles ÷ MPG) × regional price`);
    } else if (cat.includes("rental") || cat.includes("trailer") || cat.includes("truck")) {
      const saved = context.truckChoice
        ? resolveTruckChoiceOption(profile, context.truckChoice, miles, context.locale ?? "en", vehicles)
        : null;
      if (saved) {
        lines.push(`Saved choice: ${truckOptionLabel(saved)}`);
        lines.push(`Base + mileage × household (${mult.toFixed(2)}×)`);
      } else if (item.cheapestOption) {
        lines.push(`Preference: ${item.cheapestOption}`);
      }
      lines.push(`Distance: ${miles.toLocaleString()} mi`);
    } else if (cat.includes("hotel")) {
      lines.push(`Route stops with overnight stays`);
      lines.push(`Regional nightly rate × nights`);
    } else if (cat.includes("vehicle") && cat.includes("transport")) {
      lines.push(`Ship option selected: ${context.vehicleTransportChoice ?? "—"}`);
      lines.push(`Distance: ${miles.toLocaleString()} mi`);
    } else if (cat.includes("supplies")) {
      lines.push(`Household size multiplier: ${mult.toFixed(2)}×`);
    } else {
      lines.push(`Estimate based on profile and route distance (${miles} mi)`);
    }

    return { category: item.category, lines };
  });
}
