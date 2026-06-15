import type { RentalPreferenceKey } from "@/lib/move-profile";
import type { RouteStop } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";
import {
  effectiveFuelMiles,
  mpgForVehicle,
} from "@/lib/vehicles/fuel-economy";
import { averageGasPriceAlongRoute, fetchLiveElectricPricePerKwh } from "@/lib/budget/gas-prices";

export const FUEL_MILES_ADJUSTMENT = 4;

export interface FuelCostInput {
  distanceMiles: number;
  rentalKey: RentalPreferenceKey;
  vehicleCount: number;
  origin: string;
  destination: string;
  routeStops?: RouteStop[];
  vehicles?: VehicleInfo[];
  locale?: "en" | "es";
}

function mpgForRental(rentalKey: RentalPreferenceKey, vehicles: VehicleInfo[]): number {
  switch (rentalKey) {
    case "truck":
      return 10;
    case "trailer":
    case "combo": {
      const towVehicle = vehicles.find((v) => v.make?.trim() && v.model?.trim());
      if (towVehicle) return Math.round(mpgForVehicle(towVehicle) * 0.72 * 10) / 10;
      return 14;
    }
    case "movers":
      return vehicles.length
        ? vehicles.reduce((sum, v) => sum + mpgForVehicle(v), 0) / vehicles.length
        : 28;
    case "own":
    default:
      return vehicles.length
        ? vehicles.reduce((sum, v) => sum + mpgForVehicle(v), 0) / vehicles.length
        : 26;
  }
}

function drivenVehicleCount(rentalKey: RentalPreferenceKey, vehicleCount: number, vehicles: VehicleInfo[]): number {
  if (rentalKey === "truck") return 1;
  if (rentalKey === "movers") return 0;
  const count = vehicles.length || vehicleCount;
  return Math.max(1, count);
}

export async function estimateFuelCost(input: FuelCostInput): Promise<{
  total: number;
  pricePerGallon: number;
  gallons: number;
  mpg: number;
  fuelMiles: number;
  note: string;
  isElectric: boolean;
}> {
  const vehicles = (input.vehicles ?? []).filter((v) => v.make?.trim() && v.model?.trim());
  const fuelMiles = effectiveFuelMiles(input.distanceMiles);
  const pricePerGallon = await averageGasPriceAlongRoute(
    input.origin,
    input.destination,
    input.routeStops ?? []
  );

  const primaryEv = vehicles.find((v) => /electric/i.test(v.fuelType ?? ""));
  if (primaryEv && input.rentalKey !== "truck" && input.rentalKey !== "trailer" && input.rentalKey !== "combo") {
    const kwhPerMile = primaryEv.combMpg ? 33.7 / Math.max(primaryEv.combMpg, 1) : 0.3;
    const kwh = fuelMiles * kwhPerMile * drivenVehicleCount(input.rentalKey, input.vehicleCount, vehicles);
    const pricePerKwh = await fetchLiveElectricPricePerKwh();
    const total = Math.round(kwh * pricePerKwh);
    const note =
      input.locale === "es"
        ? `~${Math.round(kwh)} kWh @ $${pricePerKwh.toFixed(2)}/kWh (${primaryEv.displayLabel}, ${fuelMiles} mi efectivas).`
        : `~${Math.round(kwh)} kWh @ $${pricePerKwh.toFixed(2)}/kWh (${primaryEv.displayLabel}, ${fuelMiles} effective mi).`;
    return {
      total,
      pricePerGallon: pricePerKwh,
      gallons: Math.round(kwh),
      mpg: primaryEv.combMpg ?? 100,
      fuelMiles,
      note,
      isElectric: true,
    };
  }

  const mpg = mpgForRental(input.rentalKey, vehicles);
  const count = drivenVehicleCount(input.rentalKey, input.vehicleCount, vehicles);
  const gallons = (fuelMiles / mpg) * count;
  const total = Math.round(gallons * pricePerGallon);

  const vehicleLabel =
    vehicles.length === 1
      ? vehicles[0].displayLabel
      : vehicles.length > 1
        ? `${vehicles.length} vehicles`
        : null;

  const note =
    input.locale === "es"
      ? vehicleLabel
        ? `~${Math.round(gallons)} gal @ $${pricePerGallon.toFixed(2)}/gal (${vehicleLabel}, ${mpg} MPG combinado, ${fuelMiles} mi efectivas).`
        : `~${Math.round(gallons)} gal @ $${pricePerGallon.toFixed(2)}/gal (${mpg} MPG, ${fuelMiles} mi efectivas).`
      : vehicleLabel
        ? `~${Math.round(gallons)} gal @ $${pricePerGallon.toFixed(2)}/gal (${vehicleLabel}, ${mpg} MPG blended, ${fuelMiles} effective mi).`
        : `~${Math.round(gallons)} gal @ $${pricePerGallon.toFixed(2)}/gal (${mpg} MPG, ${fuelMiles} effective mi).`;

  return {
    total,
    pricePerGallon,
    gallons: Math.round(gallons * 10) / 10,
    mpg,
    fuelMiles,
    note,
    isElectric: false,
  };
}

/** Sync wrapper for client-side estimates without route stop gas prices. */
export function estimateFuelCostSync(
  input: Omit<FuelCostInput, "routeStops"> & { pricePerGallon?: number }
): { total: number; pricePerGallon: number; gallons: number; mpg: number; fuelMiles: number; note: string } {
  const vehicles = (input.vehicles ?? []).filter((v) => v.make?.trim() && v.model?.trim());
  const fuelMiles = effectiveFuelMiles(input.distanceMiles);
  const pricePerGallon = input.pricePerGallon ?? 3.45;
  const mpg = mpgForRental(input.rentalKey, vehicles);
  const count = drivenVehicleCount(input.rentalKey, input.vehicleCount, vehicles);
  const gallons = (fuelMiles / mpg) * count;
  const total = Math.round(gallons * pricePerGallon);
  return {
    total,
    pricePerGallon,
    gallons: Math.round(gallons * 10) / 10,
    mpg,
    fuelMiles,
    note: `~${Math.round(gallons)} gal @ $${pricePerGallon.toFixed(2)}/gal (${mpg} MPG, ${fuelMiles} mi).`,
  };
}
