import { parseCityStateLabel, normalizeUsState } from "@/lib/geo/address-region";
import {
  STATE_GAS_PRICE,
  US_AVG_GAS_PRICE,
} from "@/lib/cost-of-living/state-data";
import type { RentalPreferenceKey } from "@/lib/move-profile";

export interface FuelCostInput {
  distanceMiles: number;
  rentalKey: RentalPreferenceKey;
  vehicleCount: number;
  origin: string;
  destination: string;
}

function stateFromLabel(label: string): string | null {
  const { state } = parseCityStateLabel(label);
  return state ? normalizeUsState(state) : null;
}

/** Weighted average gas price along the route (origin + midpoint + destination states). */
export function averageGasPriceAlongRoute(origin: string, destination: string): number {
  const originState = stateFromLabel(origin);
  const destState = stateFromLabel(destination);
  const prices: number[] = [];

  if (originState && STATE_GAS_PRICE[originState]) {
    prices.push(STATE_GAS_PRICE[originState]);
  }
  if (destState && STATE_GAS_PRICE[destState]) {
    prices.push(STATE_GAS_PRICE[destState]);
  }

  if (originState && destState && originState !== destState) {
    const mid =
      ((STATE_GAS_PRICE[originState] ?? US_AVG_GAS_PRICE) +
        (STATE_GAS_PRICE[destState] ?? US_AVG_GAS_PRICE)) /
      2;
    prices.push(mid);
  }

  if (prices.length === 0) return US_AVG_GAS_PRICE;
  return Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
}

function mpgForRental(rentalKey: RentalPreferenceKey): number {
  switch (rentalKey) {
    case "truck":
      return 10;
    case "trailer":
    case "combo":
      return 14;
    case "movers":
      return 28;
    case "own":
    default:
      return 26;
  }
}

export function estimateFuelCost(input: FuelCostInput): {
  total: number;
  pricePerGallon: number;
  gallons: number;
  mpg: number;
  note: string;
} {
  const miles = Math.max(1, input.distanceMiles);
  const pricePerGallon = averageGasPriceAlongRoute(input.origin, input.destination);
  const mpg = mpgForRental(input.rentalKey);
  const vehicles = input.rentalKey === "movers" ? Math.max(1, input.vehicleCount) : Math.max(1, input.vehicleCount);
  const gallons = (miles / mpg) * vehicles;
  const total = Math.round(gallons * pricePerGallon);

  const note =
    input.rentalKey === "movers"
      ? `Personal vehicle fuel (~${mpg} MPG × ${vehicles} vehicle${vehicles > 1 ? "s" : ""} @ $${pricePerGallon.toFixed(2)}/gal avg along route).`
      : `~${Math.round(gallons)} gal @ $${pricePerGallon.toFixed(2)}/gal (${mpg} MPG${vehicles > 1 ? ` × ${vehicles} vehicles` : ""}, regional avg).`;

  return { total, pricePerGallon, gallons: Math.round(gallons), mpg, note };
}
