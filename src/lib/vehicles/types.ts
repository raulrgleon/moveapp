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

export interface VehicleTip {
  id: string;
  type: "info" | "success" | "warning";
  title: string;
  message: string;
}
