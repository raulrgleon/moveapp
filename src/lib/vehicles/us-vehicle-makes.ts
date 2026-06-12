import type { VehicleMake } from "./types";

/** Curated top-20 US passenger-vehicle manufacturers (NHTSA make IDs). */
export const US_VEHICLE_MAKES = [
  { makeId: 460, label: "Ford" },
  { makeId: 467, label: "Chevrolet" },
  { makeId: 448, label: "Toyota" },
  { makeId: 474, label: "Honda" },
  { makeId: 478, label: "Nissan" },
  { makeId: 496, label: "Ram" },
  { makeId: 483, label: "Jeep" },
  { makeId: 472, label: "GMC" },
  { makeId: 498, label: "Hyundai" },
  { makeId: 499, label: "Kia" },
  { makeId: 482, label: "Volkswagen" },
  { makeId: 523, label: "Subaru" },
  { makeId: 473, label: "Mazda" },
  { makeId: 476, label: "Dodge" },
  { makeId: 477, label: "Chrysler" },
  { makeId: 515, label: "Lexus" },
  { makeId: 452, label: "BMW" },
  { makeId: 449, label: "Mercedes-Benz" },
  { makeId: 582, label: "Audi" },
  { makeId: 441, label: "Tesla" },
] as const;

export function getUsVehicleMakes(): VehicleMake[] {
  return US_VEHICLE_MAKES.map(({ makeId, label }) => ({
    makeId,
    makeName: label,
  }));
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
