import {
  parseRentalPreferenceKey,
  rentalPreferenceFromKey,
  type RentalPreferenceKey,
} from "@/lib/move-profile";
import type { MoveProfile } from "@/lib/move-profile";
import { estimateTruckOptions } from "@/lib/trucks/recommendations";
import type { TruckOption } from "@/lib/types";

export function truckOptionLabel(option: TruckOption): string {
  return `${option.company} — ${option.vehicleSize}`;
}

export function inferRentalKeyFromTruckChoice(choice: string): RentalPreferenceKey {
  const lower = choice.toLowerCase();
  if (/trailer|remolque|6×12|6x12/i.test(lower)) return "trailer";
  if (/mover|profesional/i.test(lower)) return "movers";
  return "truck";
}

export function resolveTruckChoiceOption(
  profile: MoveProfile,
  truckChoice: string | null | undefined,
  distanceMiles: number,
  locale: "en" | "es" = "en",
  vehicles: import("@/lib/vehicles/types").VehicleInfo[] = []
): TruckOption | null {
  if (!truckChoice?.trim()) return null;
  const options = estimateTruckOptions(profile, distanceMiles, locale, vehicles);
  return options.find((o) => truckOptionLabel(o) === truckChoice) ?? null;
}

export function rentalPreferenceForTruckChoice(choice: string): string {
  const key = inferRentalKeyFromTruckChoice(choice);
  return rentalPreferenceFromKey(key);
}

export function mergeRentalPreference(current: string, truckChoice: string): string {
  const currentKey = parseRentalPreferenceKey(current);
  const nextKey = inferRentalKeyFromTruckChoice(truckChoice);
  if (currentKey === "own" || currentKey === "movers") {
    return rentalPreferenceFromKey(nextKey);
  }
  return rentalPreferenceFromKey(nextKey);
}

/**
 * Trailer rental is opt-in: only counts in budget/fuel when the user picks a truck or
 * trailer on the Trucks page. Preference alone (trailer/combo) does not add cost.
 */
export function effectiveRentalKeyForBudget(
  rentalPreference: string,
  truckChoice?: string | null
): RentalPreferenceKey {
  const pref = parseRentalPreferenceKey(rentalPreference);
  // If user explicitly says "own vehicle" or "movers", ignore stale truckChoice.
  if (pref === "own" || pref === "movers") return pref;
  if (truckChoice?.trim()) {
    return inferRentalKeyFromTruckChoice(truckChoice);
  }
  if (pref === "trailer" || pref === "combo") return "own";
  return pref;
}
