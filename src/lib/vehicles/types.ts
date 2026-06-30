export interface VehicleMake {
  makeId: number;
  makeName: string;
}

export interface VehicleModel {
  modelId: number;
  modelName: string;
}

export interface VehicleInfo {
  id: string;
  year: string;
  makeId: number;
  make: string;
  modelId: number;
  model: string;
  trim?: string;
  displayLabel: string;
  needsTransport?: boolean;
  combMpg?: number;
  cityMpg?: number;
  highwayMpg?: number;
  fuelType?: string;
}

export function createVehicleId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `veh-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyVehicle(): VehicleInfo {
  return {
    id: createVehicleId(),
    year: "",
    makeId: 0,
    make: "",
    modelId: 0,
    model: "",
    displayLabel: "",
    needsTransport: false,
  };
}

export function ensureVehicleId(vehicle: VehicleInfo): VehicleInfo {
  return vehicle.id ? vehicle : { ...vehicle, id: createVehicleId() };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCompleteVehicle(vehicle: VehicleInfo | null | undefined): boolean {
  return Boolean(vehicle?.year && vehicle?.make?.trim() && vehicle?.model?.trim());
}

/** Client ids are preserved in DB when they are valid UUIDs (stable React keys). */
export function vehicleDbId(vehicle: VehicleInfo): string | undefined {
  return vehicle.id && UUID_RE.test(vehicle.id) ? vehicle.id : undefined;
}

export interface VehicleTip {
  id: string;
  type: "info" | "success" | "warning";
  title: string;
  message: string;
}
