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
  distanceMiles: number
): TruckOption | null {
  if (!truckChoice?.trim()) return null;
  const options = estimateTruckOptions(profile, distanceMiles);
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
