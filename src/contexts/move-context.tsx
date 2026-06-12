"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import { invalidateUserData, loadUserData } from "@/lib/data-cache";
import type { AddressSuggestion } from "@/lib/geo/nominatim";
import { formatDestinationLabel } from "@/lib/geo/nominatim";
import { dispatchProfileUpdated } from "@/lib/move/profile-events";
import { MOCK_USER } from "@/lib/mock-data";
import {
  DEFAULT_PROFILE,
  geocodeQuery,
  householdWithPets,
  loadProfileFromStorage,
  saveProfileToStorage,
  type MoveProfile,
} from "@/lib/move-profile";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { createEmptyVehicle, createVehicleId, ensureVehicleId } from "@/lib/vehicles/types";
import { formatVehicleLabel } from "@/lib/vehicles/nhtsa";

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
  profile: MoveProfile;
  destinationAddress: string;
  destination: string;
  lat?: number;
  lon?: number;
  isAddressConfirmed: boolean;
  vehicles: VehicleInfo[];
  vehicle: VehicleInfo;
  isHydrated: boolean;
  profileVersion: number;
  moveRole: "owner" | "editor" | "viewer";
  ownerName: string;
  canEdit: boolean;
  canEditProfile: boolean;
  confirmAddress: (suggestion: AddressSuggestion) => void;
  clearAddress: () => void;
  setVehicles: (vehicles: VehicleInfo[]) => void;
  setVehicle: (vehicle: VehicleInfo) => void;
  updateProfile: (patch: Partial<MoveProfile>, geocode?: boolean) => Promise<void>;
  getMoveContextForApi: () => {
    profile: MoveProfile;
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
  return [];
}

export function MoveProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isHydrated: authHydrated } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedAddress | null>(null);
  const [profile, setProfile] = useState<MoveProfile>(DEFAULT_PROFILE);
  const [vehicles, setVehiclesState] = useState<VehicleInfo[]>(defaultVehicles());
  const [profileVersion, setProfileVersion] = useState(0);
  const [moveRole, setMoveRole] = useState<"owner" | "editor" | "viewer">("owner");
  const [ownerName, setOwnerName] = useState("");
  const [canEdit, setCanEdit] = useState(true);
  const [canEditProfile, setCanEditProfile] = useState(true);

  const bumpProfileVersion = useCallback(() => {
    setProfileVersion((v) => v + 1);
    dispatchProfileUpdated();
  }, []);

  const syncToDb = useCallback(
    async (payload: {
      profile?: Partial<MoveProfile>;
      destinationAddress?: string | null;
      destinationLat?: number;
      destinationLon?: number;
      destinationLabel?: string;
      vehicles?: VehicleInfo[];
    }) => {
      if (!isAuthenticated || !user?.email || !canEditProfile) return;
      await apiFetch("/api/move", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      invalidateUserData();
      bumpProfileVersion();
    },
    [isAuthenticated, user?.email, bumpProfileVersion, canEditProfile]
  );

  useEffect(() => {
    if (!authHydrated) return;

    async function load() {
      if (isAuthenticated && user?.email) {
        try {
          const data = await loadUserData(user.email);
          if (data.profile) setProfile(data.profile);
          setMoveRole(data.moveRole ?? "owner");
          setOwnerName(data.ownerName ?? "");
          setCanEdit(data.canEdit ?? true);
          setCanEditProfile(data.canEditProfile ?? true);
          setVehiclesState(data.vehicles.length ? data.vehicles : []);
          if (data.isAddressConfirmed && data.destinationAddress) {
            setConfirmed({
              displayName: data.destinationAddress,
              lat: data.destinationLat ?? 0,
              lon: data.destinationLon ?? 0,
              destinationLabel: data.profile.destination,
            });
          } else {
            setConfirmed(null);
          }
        } catch {
          setProfile(loadProfileFromStorage() ?? DEFAULT_PROFILE);
          setVehiclesState([]);
        }
      } else {
        setProfile(loadProfileFromStorage() ?? DEFAULT_PROFILE);
        setVehiclesState([]);
      }
      setIsHydrated(true);
    }

    load();
  }, [authHydrated, isAuthenticated, user?.email]);

  const confirmAddress = useCallback(
    (suggestion: AddressSuggestion) => {
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
      void syncToDb({
        destinationAddress: data.displayName,
        destinationLat: data.lat,
        destinationLon: data.lon,
        destinationLabel: data.destinationLabel,
      });
    },
    [syncToDb]
  );

  const clearAddress = useCallback(() => {
    setConfirmed(null);
    void syncToDb({ destinationAddress: null });
  }, [syncToDb]);

  const setVehicles = useCallback(
    (data: VehicleInfo[]) => {
      const normalized = data.map(ensureVehicleId);
      setVehiclesState(normalized);
      void syncToDb({ vehicles: normalized });
    },
    [syncToDb]
  );

  const setVehicle = useCallback(
    (data: VehicleInfo) => {
      setVehicles([ensureVehicleId(data)]);
    },
    [setVehicles]
  );

  const updateProfile = useCallback(
    async (patch: Partial<MoveProfile>, geocode = true) => {
      const next = { ...profile, ...patch };
      if (geocode) {
        if (patch.origin !== undefined) {
          const coords = await geocodeQuery(patch.origin);
          if (coords) {
            next.originLat = coords.lat;
            next.originLon = coords.lon;
          }
        }
        if (patch.destination !== undefined) {
          const coords = await geocodeQuery(patch.destination);
          if (coords) {
            next.destinationLat = coords.lat;
            next.destinationLon = coords.lon;
          }
        }
      }
      setProfile(next);
      if (isAuthenticated) {
        await syncToDb({ profile: next, vehicles });
      } else {
        saveProfileToStorage(next);
      }
    },
    [profile, isAuthenticated, syncToDb, vehicles]
  );

  const value = useMemo<MoveContextValue>(() => {
    const destinationAddress = confirmed?.displayName ?? "";
    const destination = confirmed?.destinationLabel ?? profile.destination;
    const primaryVehicle = vehicles[0] ?? createEmptyVehicle();

    return {
      profile,
      destinationAddress,
      destination,
      lat: confirmed?.lat,
      lon: confirmed?.lon,
      isAddressConfirmed: Boolean(confirmed),
      vehicles,
      vehicle: primaryVehicle,
      isHydrated,
      profileVersion,
      moveRole,
      ownerName,
      canEdit,
      canEditProfile,
      confirmAddress,
      clearAddress,
      setVehicles,
      setVehicle,
      updateProfile,
      getMoveContextForApi: () => ({
        profile,
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
    profile,
    confirmed,
    vehicles,
    isHydrated,
    profileVersion,
    moveRole,
    ownerName,
    canEdit,
    canEditProfile,
    confirmAddress,
    clearAddress,
    setVehicles,
    setVehicle,
    updateProfile,
  ]);

  return <MoveContext.Provider value={value}>{children}</MoveContext.Provider>;
}

export function useMove() {
  const ctx = useContext(MoveContext);
  if (!ctx) throw new Error("useMove must be used within MoveProvider");
  return ctx;
}

export { householdWithPets };
