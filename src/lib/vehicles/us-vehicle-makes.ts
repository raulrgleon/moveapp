import type { VehicleMake } from "./types";

/**
 * Curated US passenger-vehicle manufacturers (NHTSA make IDs).
 * Keep in sync with scripts/download-vehicle-catalog.mjs
 */
/** Kept alphabetical for dropdowns (localeCompare en). */
export const US_VEHICLE_MAKES = [
  { makeId: 582, label: "Audi" },
  { makeId: 452, label: "BMW" },
  { makeId: 468, label: "Buick" },
  { makeId: 469, label: "Cadillac" },
  { makeId: 467, label: "Chevrolet" },
  { makeId: 460, label: "Ford" },
  { makeId: 472, label: "GMC" },
  { makeId: 474, label: "Honda" },
  { makeId: 498, label: "Hyundai" },
  { makeId: 483, label: "Jeep" },
  { makeId: 499, label: "Kia" },
  { makeId: 515, label: "Lexus" },
  { makeId: 473, label: "Mazda" },
  { makeId: 449, label: "Mercedes-Benz" },
  { makeId: 478, label: "Nissan" },
  { makeId: 496, label: "Ram" },
  { makeId: 523, label: "Subaru" },
  { makeId: 441, label: "Tesla" },
  { makeId: 448, label: "Toyota" },
  { makeId: 482, label: "Volkswagen" },
] as const;

export function getUsVehicleMakes(): VehicleMake[] {
  return US_VEHICLE_MAKES.map(({ makeId, label }) => ({
    makeId,
    makeName: label,
  })).sort((a, b) => a.makeName.localeCompare(b.makeName, "en"));
}

export function modelOptionKey(modelId: number, modelName: string): string {
  return `${modelId}::${modelName}`;
}

export function parseModelOptionKey(key: string): { modelId: number; modelName: string } {
  const sep = key.indexOf("::");
  if (sep === -1) return { modelId: 0, modelName: key };
  return {
    modelId: Number(key.slice(0, sep)) || 0,
    modelName: key.slice(sep + 2),
  };
}
