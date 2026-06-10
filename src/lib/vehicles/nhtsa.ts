import type { VehicleMake, VehicleModel } from "./types";

const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

export function getVehicleYears(): string[] {
  const current = new Date().getFullYear() + 1;
  const years: string[] = [];
  for (let y = current; y >= 1990; y--) {
    years.push(String(y));
  }
  return years;
}

export async function fetchMakesForCars(): Promise<VehicleMake[]> {
  const res = await fetch(
    `${NHTSA_BASE}/GetMakesForVehicleType/car?format=json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error("Failed to fetch vehicle makes");

  const data = await res.json();
  const seen = new Set<string>();
  const makes: VehicleMake[] = [];

  for (const row of data.Results ?? []) {
    const makeName = row.MakeName as string;
    const makeId = Number(row.MakeId);
    if (!makeName || !makeId || seen.has(makeName)) continue;
    seen.add(makeName);
    makes.push({ makeId, makeName });
  }

  return makes.sort((a, b) => a.makeName.localeCompare(b.makeName));
}

export async function fetchModelsForMakeYear(
  makeId: number,
  year: string
): Promise<VehicleModel[]> {
  const res = await fetch(
    `${NHTSA_BASE}/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error("Failed to fetch vehicle models");

  const data = await res.json();
  const seen = new Set<string>();
  const models: VehicleModel[] = [];

  for (const row of data.Results ?? []) {
    const modelName = row.Model_Name as string;
    const modelId = Number(row.Model_ID ?? row.ModelId ?? 0);
    if (!modelName || seen.has(modelName)) continue;
    seen.add(modelName);
    models.push({ modelId, modelName });
  }

  return models.sort((a, b) => a.modelName.localeCompare(b.modelName));
}

export function formatVehicleLabel(
  year: string,
  make: string,
  model: string,
  trim?: string
): string {
  const base = `${year} ${make} ${model}`;
  return trim?.trim() ? `${base} ${trim.trim()}` : base;
}
