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

const STORAGE_KEY = "movepilot_destination";

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
  isHydrated: boolean;
  confirmAddress: (suggestion: AddressSuggestion) => void;
  clearAddress: () => void;
  getMoveContextForApi: () => {
    destinationAddress: string;
    destination: string;
    lat?: number;
    lon?: number;
    isAddressConfirmed: boolean;
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

export function MoveProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedAddress | null>(null);

  useEffect(() => {
    setConfirmed(loadStored());
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

  const value = useMemo<MoveContextValue>(() => {
    const destinationAddress = confirmed?.displayName ?? "";
    const destination =
      confirmed?.destinationLabel ?? MOCK_USER.destination;

    return {
      destinationAddress,
      destination,
      lat: confirmed?.lat,
      lon: confirmed?.lon,
      isAddressConfirmed: Boolean(confirmed),
      isHydrated,
      confirmAddress,
      clearAddress,
      getMoveContextForApi: () => ({
        destinationAddress,
        destination,
        lat: confirmed?.lat,
        lon: confirmed?.lon,
        isAddressConfirmed: Boolean(confirmed),
      }),
    };
  }, [confirmed, isHydrated, confirmAddress, clearAddress]);

  return <MoveContext.Provider value={value}>{children}</MoveContext.Provider>;
}

export function useMove() {
  const ctx = useContext(MoveContext);
  if (!ctx) throw new Error("useMove must be used within MoveProvider");
  return ctx;
}
