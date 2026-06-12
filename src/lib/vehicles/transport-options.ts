import { estimateFuelCost } from "@/lib/trucks/recommendations";
import type { VehicleOption } from "@/lib/types";

export function estimateVehicleTransportOptions(
  distanceMiles: number,
  vehicleCount: number
): VehicleOption[] {
  const miles = Math.max(50, distanceMiles);
  const count = Math.max(1, vehicleCount);
  const fuel = estimateFuelCost(miles, count);
  const trailer = Math.round(89 + miles * 0.32);
  const ship = Math.round(900 + miles * 0.15 * count);
  const dolly = Math.round(120 + miles * 0.08);

  return [
    {
      id: "1",
      title: "Drive your vehicle",
      description: "Tow a trailer with your own vehicle. Best balance of cost and control on long routes.",
      estimatedCost: fuel + trailer + Math.round(miles * 0.12),
      fuelEstimate: fuel,
      wearAndTear: Math.round(miles * 0.11),
      recommended: true,
    },
    {
      id: "2",
      title: "Rent trailer only",
      description: "U-Haul-style open trailer. You drive your own tow vehicle.",
      estimatedCost: trailer + fuel,
      fuelEstimate: fuel,
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
      estimatedCost: dolly + Math.round(fuel * 0.2),
      fuelEstimate: Math.round(fuel * 0.2),
      wearAndTear: Math.round(miles * 0.06),
    },
  ];
}

export function buildUshipSearchUrl(origin: string, destination: string): string {
  const q = `${origin} to ${destination} vehicle shipping`;
  return `https://www.uship.com/ship/vehicles/?q=${encodeURIComponent(q)}`;
}
