import type { RentalPreferenceKey } from "@/lib/move-profile";

export const TRUCK_OPTION_IDS = [
  "uhaul-trailer",
  "penske-truck",
  "budget-truck",
  "uhaul-truck",
] as const;

export type TruckOptionId = (typeof TRUCK_OPTION_IDS)[number];

/** Household size multiplier for rental and supply estimates. */
export function householdMultiplier(household: string): number {
  if (/4|5|6|large|grande/i.test(household)) return 1.35;
  if (/3|three|tres/i.test(household)) return 1.2;
  if (/2|two|dos|couple/i.test(household)) return 1.0;
  return 0.85;
}

export function normalizedMoveMiles(distanceMiles: number): number {
  return Math.max(50, distanceMiles);
}

/** Canonical truck/trailer rental price (same on Trucks + Budget pages). */
export function computeTruckOptionPrice(
  optionId: TruckOptionId | string,
  distanceMiles: number,
  household: string
): number {
  const miles = normalizedMoveMiles(distanceMiles);
  const mult = householdMultiplier(household);

  switch (optionId) {
    case "uhaul-trailer":
      return Math.round(89 + miles * 0.32 * mult);
    case "penske-truck":
      return Math.round(199 + miles * 0.78 * mult);
    case "budget-truck":
      return Math.round(175 + miles * 0.72 * mult);
    case "uhaul-truck":
      return Math.round(279 + miles * 0.92 * mult);
    default:
      return 0;
  }
}

/** Rental estimate when no specific truck option is saved. */
export function computeRentalByPreferenceKey(
  rentalKey: RentalPreferenceKey,
  distanceMiles: number,
  household: string
): { category: string; estimated: number; cheapestOption?: string } | null {
  const miles = normalizedMoveMiles(distanceMiles);
  const mult = householdMultiplier(household);

  switch (rentalKey) {
    case "movers":
      return {
        category: "Professional movers",
        estimated: Math.round(1800 * mult + miles * 0.45),
      };
    case "truck":
      return {
        category: "Truck rental",
        estimated: computeTruckOptionPrice("penske-truck", miles, household),
        cheapestOption: "Compare Penske vs U-Haul on Trucks page",
      };
    case "trailer":
      return {
        category: "Trailer rental",
        estimated: computeTruckOptionPrice("uhaul-trailer", miles, household),
        cheapestOption: "6×12 open trailer + your SUV",
      };
    case "combo":
      return {
        category: "Trailer rental",
        estimated: Math.round(computeTruckOptionPrice("uhaul-trailer", miles, household) * 1.08),
        cheapestOption: "Trailer towed by your vehicle",
      };
    case "own":
    default:
      return null;
  }
}

export function computeMoversCost(distanceMiles: number, household: string): number {
  const miles = normalizedMoveMiles(distanceMiles);
  return Math.round(1800 * householdMultiplier(household) + miles * 0.45);
}

export function computeVehicleShipCost(distanceMiles: number, vehicleCount = 1): number {
  const miles = normalizedMoveMiles(distanceMiles);
  return Math.round(900 + miles * 0.15 * Math.max(1, vehicleCount));
}

export function computeTowDollyCost(distanceMiles: number): number {
  const miles = normalizedMoveMiles(distanceMiles);
  return Math.round(120 + miles * 0.08);
}

export function computeWearAndTear(distanceMiles: number, ratePerMile = 0.11): number {
  return Math.round(normalizedMoveMiles(distanceMiles) * ratePerMile);
}

/** Rough drive + trailer combo (vehicles page option 1). */
export function computeDriveWithTrailerCost(
  distanceMiles: number,
  household: string,
  fuelTotal: number
): number {
  const miles = normalizedMoveMiles(distanceMiles);
  const trailer = computeTruckOptionPrice("uhaul-trailer", miles, household);
  return fuelTotal + trailer + Math.round(miles * 0.12);
}

export function isShipTransportChoice(choice: string | null | undefined): boolean {
  if (!choice?.trim()) return false;
  return /ship|env[ií]o|transport|car carrier/i.test(choice);
}
