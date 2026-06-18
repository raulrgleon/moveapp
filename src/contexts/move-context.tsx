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
import { loadUserData, type UserDataPayload } from "@/lib/data-cache";
import type { AddressSuggestion } from "@/lib/geo/nominatim";
import { formatDestinationLabel } from "@/lib/geo/nominatim";
import { refreshMoveData, subscribeProfileUpdated } from "@/lib/move/refresh-data";
import { dispatchProfileUpdated } from "@/lib/move/profile-events";
import { storeRouteIndex } from "@/hooks/use-route-stats";
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
  destinationPostcode?: string;
  isAddressConfirmed: boolean;
  vehicles: VehicleInfo[];
  vehicle: VehicleInfo;
  isHydrated: boolean;
  profileVersion: number;
  moveRole: "owner" | "editor" | "viewer";
  ownerName: string;
  canEdit: boolean;
  canEditProfile: boolean;
  truckChoice: string | null;
  vehicleTransportChoice: string | null;
  setTruckChoice: (choice: string | null) => void;
  setVehicleTransportChoice: (choice: string | null) => void;
  confirmAddress: (suggestion: AddressSuggestion) => void;
  clearAddress: () => void;
  setVehicles: (vehicles: VehicleInfo[]) => void;
  setVehicle: (vehicle: VehicleInfo) => void;
  updateProfile: (patch: Partial<MoveProfile>, geocode?: boolean, sync?: boolean) => Promise<void>;
  getMoveContextForApi: () => {
    profile: MoveProfile;
    destinationAddress: string;
    destination: string;
    lat?: number;
    lon?: number;
    destinationPostcode?: string;
    isAddressConfirmed: boolean;
    vehicles: VehicleInfo[];
    vehicle: VehicleInfo;
  };
}

const MoveContext = createContext<MoveContextValue | null>(null);

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
  const [canEdit, setCanEdit] = useState(false);
  const [canEditProfile, setCanEditProfile] = useState(false);
  const [truckChoice, setTruckChoiceState] = useState<string | null>(null);
  const [vehicleTransportChoice, setVehicleTransportChoiceState] = useState<string | null>(null);

  const bumpProfileVersion = useCallback(() => {
    setProfileVersion((v) => v + 1);
  }, []);

  const applyUserData = useCallback((data: UserDataPayload) => {
    if (data.profile) setProfile(data.profile);
    setMoveRole(data.moveRole ?? "owner");
    setOwnerName(data.ownerName ?? "");
    setCanEdit(data.canEdit ?? true);
    setCanEditProfile(data.canEditProfile ?? true);
    setVehiclesState(data.vehicles.length ? data.vehicles : []);
    setTruckChoiceState(data.truckChoice ?? null);
    setVehicleTransportChoiceState(data.vehicleTransportChoice ?? null);
    if (typeof data.selectedRouteIndex === "number") {
      storeRouteIndex(data.selectedRouteIndex);
    }
    if (data.isAddressConfirmed && data.destinationAddress) {
      setConfirmed({
        displayName: data.destinationAddress,
        lat: data.destinationLat ?? 0,
        lon: data.destinationLon ?? 0,
        destinationLabel: data.profile?.destination ?? "",
        postcode: data.profile?.destination.match(/\b\d{5}\b/)?.[0],
      });
    } else {
      setConfirmed(null);
    }
  }, []);

  const syncToDb = useCallback(
    async (payload: {
      profile?: Partial<MoveProfile>;
      destinationAddress?: string | null;
      destinationLat?: number;
      destinationLon?: number;
      destinationLabel?: string;
      vehicles?: VehicleInfo[];
      truckChoice?: string | null;
      vehicleTransportChoice?: string | null;
    }) => {
      if (!isAuthenticated || !user?.email || user.role === "admin" || !canEditProfile) {
        return;
      }
      await apiFetch("/api/move", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await refreshMoveData(user.email);
      bumpProfileVersion();
    },
    [isAuthenticated, user?.email, user?.role, bumpProfileVersion, canEditProfile]
  );

  useEffect(() => {
    if (!authHydrated) return;

    async function load() {
      if (isAuthenticated && user?.email) {
        try {
          const data = await loadUserData(user.email);
          applyUserData(data);
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
  }, [authHydrated, isAuthenticated, user?.email, applyUserData]);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    return subscribeProfileUpdated(() => {
      void loadUserData(user.email, true)
        .then((data) => {
          applyUserData(data);
          bumpProfileVersion();
        })
        .catch(() => {});
    });
  }, [isAuthenticated, user?.email, applyUserData, bumpProfileVersion]);

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

  const setTruckChoice = useCallback(
    (choice: string | null) => {
      setTruckChoiceState(choice);
      void syncToDb({ truckChoice: choice });
    },
    [syncToDb]
  );

  const setVehicleTransportChoice = useCallback(
    (choice: string | null) => {
      setVehicleTransportChoiceState(choice);
      void syncToDb({ vehicleTransportChoice: choice });
    },
    [syncToDb]
  );

  const updateProfile = useCallback(
    async (patch: Partial<MoveProfile>, geocode = true, sync = true) => {
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
      saveProfileToStorage(next);
      if (!sync || !isAuthenticated || user?.role === "admin" || !canEditProfile) {
        return;
      }
      await syncToDb({ profile: next, vehicles });
    },
    [profile, isAuthenticated, user?.role, canEditProfile, syncToDb, vehicles]
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
      destinationPostcode: confirmed?.postcode,
      isAddressConfirmed: Boolean(confirmed),
      vehicles,
      vehicle: primaryVehicle,
      isHydrated,
      profileVersion,
      moveRole,
      ownerName,
      canEdit,
      canEditProfile,
      truckChoice,
      vehicleTransportChoice,
      setTruckChoice,
      setVehicleTransportChoice,
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
        destinationPostcode: confirmed?.postcode,
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
    truckChoice,
    vehicleTransportChoice,
    setTruckChoice,
    setVehicleTransportChoice,
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
