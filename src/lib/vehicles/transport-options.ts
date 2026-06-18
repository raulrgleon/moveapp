import {
  computeDriveWithTrailerCost,
  computeTowDollyCost,
  computeTruckOptionPrice,
  computeVehicleShipCost,
  computeWearAndTear,
  normalizedMoveMiles,
} from "@/lib/budget/pricing";
import { estimateFuelCostSync } from "@/lib/budget/fuel-cost";
import type { VehicleOption } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";

export function estimateVehicleTransportOptions(
  distanceMiles: number,
  vehicles: VehicleInfo[],
  origin = "",
  destination = "",
  household = ""
): VehicleOption[] {
  const miles = normalizedMoveMiles(distanceMiles);
  const count = Math.max(1, vehicles.length);

  const trailerFuel = estimateFuelCostSync({
    distanceMiles: miles,
    rentalKey: "combo",
    vehicleCount: count,
    origin,
    destination,
    vehicles,
  }).total;

  const driveFuel = estimateFuelCostSync({
    distanceMiles: miles,
    rentalKey: "own",
    vehicleCount: count,
    origin,
    destination,
    vehicles,
  }).total;

  const trailer = computeTruckOptionPrice("uhaul-trailer", miles, household);
  const ship = computeVehicleShipCost(miles, count);
  const dolly = computeTowDollyCost(miles);
  const primary = vehicles[0];

  return [
    {
      id: "1",
      title: "Drive your vehicle",
      description: primary?.combMpg
        ? `Tow a trailer with your ${primary.displayLabel} (${primary.combMpg} MPG EPA).`
        : "Tow a trailer with your own vehicle. Best balance of cost and control on long routes.",
      estimatedCost: computeDriveWithTrailerCost(miles, household, driveFuel),
      fuelEstimate: driveFuel,
      wearAndTear: computeWearAndTear(miles),
      recommended: true,
    },
    {
      id: "2",
      title: "Rent trailer only",
      description: "U-Haul-style open trailer. You drive your own tow vehicle.",
      estimatedCost: trailer + trailerFuel,
      fuelEstimate: trailerFuel,
    },
    {
      id: "3",
      title: "Ship your vehicle",
      description: "Auto transport service. Fly or drive separately to your destination.",
      estimatedCost: ship,
      fuelEstimate: 0,
      wearAndTear: 0,
    },
    {
      id: "4",
      title: "Use a tow dolly",
      description: "Tow a second vehicle behind your primary car. Limited combo with trailers.",
      estimatedCost: dolly + Math.round(driveFuel * 0.2),
      fuelEstimate: Math.round(driveFuel * 0.2),
      wearAndTear: computeWearAndTear(miles, 0.06),
    },
  ];
}

export function buildUshipSearchUrl(origin: string, destination: string): string {
  const q = `${origin} to ${destination} vehicle shipping`;
  return `https://www.uship.com/ship/vehicles/?q=${encodeURIComponent(q)}`;
}
