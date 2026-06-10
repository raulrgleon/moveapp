"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AddressSuggestion } from "@/lib/geo/nominatim";
import { formatDestinationLabel } from "@/lib/geo/nominatim";
import { MOCK_USER } from "@/lib/mock-data";
import type { VehicleInfo } from "@/lib/vehicles/types";
import {
  createVehicleId,
  ensureVehicleId,
} from "@/lib/vehicles/types";
import { formatVehicleLabel } from "@/lib/vehicles/nhtsa";

const STORAGE_KEY = "movepilot_destination";
const VEHICLES_STORAGE_KEY = "movepilot_vehicles";
const LEGACY_VEHICLE_KEY = "movepilot_vehicle";

const DEFAULT_VEHICLE: VehicleInfo = {
  id: "default-atlas",
  year: "2019",
  makeId: 482,
  make: "VOLKSWAGEN",
  modelId: 1861,
  model: "Atlas",
  trim: "V6 4Motion",
  displayLabel: "2019 Volkswagen Atlas V6 4Motion",
};

export interface ConfirmedAddress {
  displayName: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  postcode?: string;
  destinationLabel: string;
}

interface MoveContextValue {
  destinationAddress: string;
  destination: string;
  lat?: number;
  lon?: number;
  isAddressConfirmed: boolean;
  vehicles: VehicleInfo[];
  /** Primer vehículo (compatibilidad) */
  vehicle: VehicleInfo;
  isHydrated: boolean;
  confirmAddress: (suggestion: AddressSuggestion) => void;
  clearAddress: () => void;
  setVehicles: (vehicles: VehicleInfo[]) => void;
  setVehicle: (vehicle: VehicleInfo) => void;
  getMoveContextForApi: () => {
    destinationAddress: string;
    destination: string;
    lat?: number;
    lon?: number;
    isAddressConfirmed: boolean;
    vehicles: VehicleInfo[];
    vehicle: VehicleInfo;
  };
}

const MoveContext = createContext<MoveContextValue | null>(null);

function loadStored(): ConfirmedAddress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConfirmedAddress;
  } catch {
    return null;
  }
}

function saveStored(data: ConfirmedAddress | null) {
  if (typeof window === "undefined") return;
  if (data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function loadVehiclesStored(): VehicleInfo[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VEHICLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VehicleInfo[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(ensureVehicleId);
      }
    }
    const legacy = localStorage.getItem(LEGACY_VEHICLE_KEY);
    if (legacy) {
      const single = JSON.parse(legacy) as VehicleInfo;
      return [ensureVehicleId(single)];
    }
  } catch {
    return null;
  }
  return null;
}

function saveVehiclesStored(data: VehicleInfo[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(data));
}

function vehicleFromMockLabel(): VehicleInfo {
  const label = MOCK_USER.vehicles[0] ?? DEFAULT_VEHICLE.displayLabel;
  const match = label.match(/^(\d{4})\s+(.+?)\s+([^\s]+)(?:\s+(.*))?$/);
  if (!match) return { ...DEFAULT_VEHICLE, id: createVehicleId() };
  const [, year, make, model, trim] = match;
  return {
    id: createVehicleId(),
    year,
    makeId: DEFAULT_VEHICLE.makeId,
    make,
    modelId: DEFAULT_VEHICLE.modelId,
    model,
    trim: trim?.trim() || undefined,
    displayLabel: formatVehicleLabel(year, make, model, trim),
  };
}

function defaultVehicles(): VehicleInfo[] {
  return [{ ...DEFAULT_VEHICLE, id: createVehicleId() }];
}

export function MoveProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedAddress | null>(null);
  const [vehicles, setVehiclesState] = useState<VehicleInfo[]>(defaultVehicles());

  useEffect(() => {
    setConfirmed(loadStored());
    setVehiclesState(
      loadVehiclesStored() ?? [vehicleFromMockLabel()]
    );
    setIsHydrated(true);
  }, []);

  const confirmAddress = useCallback((suggestion: AddressSuggestion) => {
    const data: ConfirmedAddress = {
      displayName: suggestion.displayName,
      lat: suggestion.lat,
      lon: suggestion.lon,
      city: suggestion.city,
      state: suggestion.state,
      postcode: suggestion.postcode,
      destinationLabel: formatDestinationLabel(suggestion),
    };
    setConfirmed(data);
    saveStored(data);
  }, []);

  const clearAddress = useCallback(() => {
    setConfirmed(null);
    saveStored(null);
  }, []);

  const setVehicles = useCallback((data: VehicleInfo[]) => {
    const normalized = data.length > 0 ? data.map(ensureVehicleId) : defaultVehicles();
    setVehiclesState(normalized);
    saveVehiclesStored(normalized);
  }, []);

  const setVehicle = useCallback(
    (data: VehicleInfo) => {
      setVehicles([ensureVehicleId(data)]);
    },
    [setVehicles]
  );

  const value = useMemo<MoveContextValue>(() => {
    const destinationAddress = confirmed?.displayName ?? "";
    const destination =
      confirmed?.destinationLabel ?? MOCK_USER.destination;
    const primaryVehicle = vehicles[0] ?? defaultVehicles()[0];

    return {
      destinationAddress,
      destination,
      lat: confirmed?.lat,
      lon: confirmed?.lon,
      isAddressConfirmed: Boolean(confirmed),
      vehicles,
      vehicle: primaryVehicle,
      isHydrated,
      confirmAddress,
      clearAddress,
      setVehicles,
      setVehicle,
      getMoveContextForApi: () => ({
        destinationAddress,
        destination,
        lat: confirmed?.lat,
        lon: confirmed?.lon,
        isAddressConfirmed: Boolean(confirmed),
        vehicles,
        vehicle: primaryVehicle,
      }),
    };
  }, [
    confirmed,
    vehicles,
    isHydrated,
    confirmAddress,
    clearAddress,
    setVehicles,
    setVehicle,
  ]);

  return <MoveContext.Provider value={value}>{children}</MoveContext.Provider>;
}

export function useMove() {
  const ctx = useContext(MoveContext);
  if (!ctx) throw new Error("useMove must be used within MoveProvider");
  return ctx;
}
