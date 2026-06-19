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
import {
  clearGuestProfileStorage,
  DEFAULT_PROFILE,
  geocodeQuery,
  householdWithPets,
  loadGuestProfileFromStorage,
  saveGuestProfileToStorage,
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
  selectedRouteIndex: number;
  setSelectedRouteIndex: (index: number, syncBudget?: boolean) => void;
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
  const [canEdit, setCanEdit] = useState(true);
  const [canEditProfile, setCanEditProfile] = useState(true);
  const [truckChoice, setTruckChoiceState] = useState<string | null>(null);
  const [vehicleTransportChoice, setVehicleTransportChoiceState] = useState<string | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndexState] = useState(0);

  const bumpProfileVersion = useCallback(() => {
    setProfileVersion((v) => v + 1);
  }, []);

  async function mergeGuestProfileIntoDb(email: string): Promise<UserDataPayload | null> {
    const guest = loadGuestProfileFromStorage();
    if (!guest?.origin?.trim() || !guest?.destination?.trim()) {
      clearGuestProfileStorage();
      return null;
    }
    try {
      await apiFetch("/api/move", {
        method: "PATCH",
        body: JSON.stringify({ profile: guest }),
      });
      clearGuestProfileStorage();
      await refreshMoveData(email);
      return loadUserData(email, true);
    } catch {
      return null;
    }
  }

  const applyUserData = useCallback((data: UserDataPayload) => {
    if (data.profile) setProfile(data.profile);
    setMoveRole(data.moveRole ?? "owner");
    setOwnerName(data.ownerName ?? "");
    setCanEdit(data.canEdit ?? true);
    setCanEditProfile(data.canEditProfile ?? true);
    setVehiclesState(data.vehicles.length ? data.vehicles : []);
    setTruckChoiceState(data.truckChoice ?? null);
    setVehicleTransportChoiceState(data.vehicleTransportChoice ?? null);
    setSelectedRouteIndexState(
      typeof data.selectedRouteIndex === "number" ? data.selectedRouteIndex : 0
    );
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
      try {
        await apiFetch("/api/move", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        await refreshMoveData(user.email);
        bumpProfileVersion();
        dispatchProfileUpdated();
      } catch (error) {
        console.error("Failed to sync move profile:", error);
        throw error;
      }
    },
    [isAuthenticated, user?.email, user?.role, bumpProfileVersion, canEditProfile]
  );

  useEffect(() => {
    if (!authHydrated) return;

    let cancelled = false;

    async function load() {
      setIsHydrated(false);
      setConfirmed(null);
      setProfile(DEFAULT_PROFILE);
      setVehiclesState([]);
      setTruckChoiceState(null);
      setVehicleTransportChoiceState(null);
      setSelectedRouteIndexState(0);

      if (isAuthenticated && user?.email) {
        try {
          let data = await loadUserData(user.email);
          if (cancelled) return;

          const serverEmpty =
            !data.profile?.origin?.trim() || !data.profile?.destination?.trim();
          if (serverEmpty) {
            const merged = await mergeGuestProfileIntoDb(user.email);
            if (merged && !cancelled) data = merged;
          } else {
            clearGuestProfileStorage();
          }

          if (cancelled) return;
          applyUserData(data);
        } catch {
          if (cancelled) return;
          setProfile(DEFAULT_PROFILE);
          setVehiclesState([]);
        }
      } else {
        setProfile(loadGuestProfileFromStorage() ?? DEFAULT_PROFILE);
        setVehiclesState([]);
      }
      if (!cancelled) setIsHydrated(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, isAuthenticated, user?.email, user?.id, applyUserData]);

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

  const setSelectedRouteIndex = useCallback(
    (index: number, syncBudget = true) => {
      setSelectedRouteIndexState(index);
      if (!isAuthenticated || !canEdit) return;

      void (async () => {
        try {
          const res = await apiFetch("/api/move/route-index", {
            method: "PATCH",
            body: JSON.stringify({ routeIndex: index, syncBudget }),
          });
          if (!res.ok) return;
          const json = (await res.json()) as {
            budgetDelta?: {
              previousEstimated: number;
              newEstimated: number;
              delta: number;
            } | null;
          };
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("movepilot:budget-route-sync", {
                detail: json.budgetDelta ?? null,
              })
            );
          }
          bumpProfileVersion();
        } catch {
          /* best-effort */
        }
      })();
    },
    [isAuthenticated, canEdit, bumpProfileVersion]
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
    async (patch: Partial<MoveProfile>, geocode = true, _sync = true) => {
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

      const isGuest = !isAuthenticated || user?.role === "admin";
      if (isGuest) {
        saveGuestProfileToStorage(next);
        return;
      }
      if (!canEditProfile) return;

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
      selectedRouteIndex,
      setSelectedRouteIndex,
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
    selectedRouteIndex,
    setSelectedRouteIndex,
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
