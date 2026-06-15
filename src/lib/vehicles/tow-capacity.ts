import type { VehicleInfo } from "./types";
import {
  EV_KEYWORDS,
  SMALL_CAR_KEYWORDS,
  TOWING_SUV_KEYWORDS,
  TRUCK_KEYWORDS,
} from "./tow-keywords";

function includesKeyword(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export type TowCapability = "strong" | "limited" | "none";

export function getVehicleTowCapability(vehicle: VehicleInfo | null | undefined): TowCapability {
  if (!vehicle?.make || !vehicle?.model) return "limited";
  const label = `${vehicle.make} ${vehicle.model} ${vehicle.trim ?? ""}`;

  if (includesKeyword(label, EV_KEYWORDS) || includesKeyword(label, SMALL_CAR_KEYWORDS)) {
    return "none";
  }
  if (includesKeyword(label, TOWING_SUV_KEYWORDS) || includesKeyword(label, TRUCK_KEYWORDS)) {
    return "strong";
  }
  return "limited";
}

export function canVehicleTowTrailer(vehicle: VehicleInfo | null | undefined): boolean {
  return getVehicleTowCapability(vehicle) !== "none";
}

export function anyVehicleCanTow(vehicles: VehicleInfo[]): boolean {
  if (vehicles.length === 0) return true;
  return vehicles.some((v) => canVehicleTowTrailer(v));
}
