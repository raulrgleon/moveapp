import type { MoveProfile } from "@/lib/move-profile";
import type { TruckOption } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { estimateFuelCost as estimateRouteFuel } from "@/lib/budget/fuel-cost";

export function estimateTruckOptions(
  profile: MoveProfile,
  distanceMiles: number
): TruckOption[] {
  const miles = Math.max(50, distanceMiles);
  const mult = /4|5|6|large|grande/i.test(profile.household) ? 1.2 : 1;

  const trailerPrice = Math.round(89 + miles * 0.32 * mult);
  const truckSmall = Math.round(199 + miles * 0.78 * mult);
  const truckLarge = Math.round(279 + miles * 0.92 * mult);
  const budgetTruck = Math.round(175 + miles * 0.72 * mult);

  return [
    {
      id: "uhaul-trailer",
      company: "U-Haul",
      estimatedPrice: trailerPrice,
      vehicleSize: "6×12 Open Trailer",
      mileagePolicy: "Unlimited miles included",
      pros: ["Widest location network", "Unlimited miles", "Works with most SUVs"],
      cons: ["Older equipment at some locations", "Insurance add-on recommended"],
      bestFor: "DIY movers with a capable tow vehicle",
      type: "trailer",
    },
    {
      id: "penske-truck",
      company: "Penske",
      estimatedPrice: truckSmall,
      vehicleSize: "12 ft Truck",
      mileagePolicy: `$0.99/mile after ${Math.max(200, Math.round(miles * 0.15))} miles`,
      pros: ["Newer trucks", "Reliable maintenance", "Easy loading ramp"],
      cons: ["Higher base cost", "Mileage charges add up on long routes"],
      bestFor: "Full truck rental without your own vehicle",
      type: "truck",
    },
    {
      id: "budget-truck",
      company: "Budget",
      estimatedPrice: budgetTruck,
      vehicleSize: "16 ft Truck",
      mileagePolicy: `$0.79/mile after ${Math.max(150, Math.round(miles * 0.12))} miles`,
      pros: ["Competitive pricing", "Larger capacity", "AAA discounts available"],
      cons: ["Limited trailer options", "Availability varies by location"],
      bestFor: "Medium households on a budget",
      type: "truck",
    },
    {
      id: "uhaul-truck",
      company: "U-Haul",
      estimatedPrice: truckLarge,
      vehicleSize: "15 ft Truck",
      mileagePolicy: `$0.69/mile after ${Math.max(200, Math.round(miles * 0.15))} miles`,
      pros: ["One-way options", "Many pickup locations", "Add-on towing available"],
      cons: ["Can sell out near peak season", "Fuel costs on long routes"],
      bestFor: "Larger loads without towing",
      type: "truck",
    },
  ];
}

export function buildTrailerRecommendation(
  profile: MoveProfile,
  distanceMiles: number,
  vehicles: VehicleInfo[]
): string {
  const miles = Math.max(50, distanceMiles);
  const origin = profile.origin.split(",")[0]?.trim() || "origin";
  const dest = profile.destination.split(",")[0]?.trim() || "destination";
  const trailer = Math.round(89 + miles * 0.32);
  const truck = Math.round(199 + miles * 0.78);
  const savings = Math.max(0, truck - trailer);
  const vehicle = vehicles[0]?.displayLabel;

  if (/mover|profesional/i.test(profile.rentalPreference)) {
    return `For your ${miles.toLocaleString()}-mile move from ${origin} to ${dest}, professional movers may be simplest for ${profile.household}. Get quotes based on inventory size and access at both ends.`;
  }

  if (vehicle) {
    return `For your ${miles.toLocaleString()}-mile move from ${origin} to ${dest}, a 6×12 trailer with your ${vehicle} is estimated around $${trailer.toLocaleString()} — about $${savings.toLocaleString()} less than a comparable truck rental.`;
  }

  return `For your ${miles.toLocaleString()}-mile move from ${origin} to ${dest}, trailer rental (~$${trailer.toLocaleString()}) is often cheaper than a truck (~$${truck.toLocaleString()}) if you have a tow-capable vehicle.`;
}

export function estimateFuelCost(distanceMiles: number, vehicleCount: number): number {
  const { total } = estimateRouteFuel({
    distanceMiles,
    rentalKey: "own",
    vehicleCount,
    origin: "",
    destination: "",
  });
  return total;
}
