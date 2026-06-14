import type { VehicleModel } from "./types";
import catalog from "./data/vehicle-catalog.json";

export interface VehicleCatalog {
  version: number;
  generatedAt: string;
  makes: { makeId: number; label: string }[];
  years: string[];
  models: Record<string, VehicleModel[]>;
}

const data = catalog as VehicleCatalog;

export function isVehicleCatalogLoaded(): boolean {
  return data.version > 0 && Object.keys(data.models).length > 100;
}

export function getCatalogModels(makeId: number, year: string): VehicleModel[] | null {
  const key = `${makeId}-${year}`;
  const models = data.models[key];
  return models?.length ? models : null;
}

export function getCatalogMeta() {
  return {
    version: data.version,
    generatedAt: data.generatedAt,
    entryCount: Object.keys(data.models).length,
  };
}
