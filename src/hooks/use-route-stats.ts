"use client";

import { useCallback, useEffect, useState } from "react";
import { useMove } from "@/contexts/move-context";
import type { RouteStop } from "@/lib/types";

export interface RouteAlternativeSummary {
  index: number;
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  coordinates: [number, number][];
}

export interface RouteStatsResponse {
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  stopCount: number;
  stops: RouteStop[];
  alternatives: RouteAlternativeSummary[];
  selectedRouteIndex: number;
}

const ROUTE_INDEX_KEY = "movepilot_selected_route";

export function getStoredRouteIndex(): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(ROUTE_INDEX_KEY);
  const n = v ? parseInt(v, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function storeRouteIndex(index: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROUTE_INDEX_KEY, String(index));
}

export function useRouteStats() {
  const { profile, lat, lon, isHydrated, profileVersion, vehicles } = useMove();
  const [stats, setStats] = useState<RouteStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeIndex, setRouteIndexState] = useState(0);

  const destLat = profile.destinationLat ?? lat;
  const destLon = profile.destinationLon ?? lon;

  useEffect(() => {
    setRouteIndexState(getStoredRouteIndex());
  }, []);

  const setRouteIndex = useCallback((index: number) => {
    storeRouteIndex(index);
    setRouteIndexState(index);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const hasCoords =
      profile.originLat != null &&
      profile.originLon != null &&
      destLat != null &&
      destLon != null;

    if (!hasCoords) {
      setStats(null);
      setLoading(false);
      setError("missing_coords");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          origin: profile.origin,
          destination: profile.destination,
          originLat: String(profile.originLat),
          originLon: String(profile.originLon),
          destinationLat: String(destLat),
          destinationLon: String(destLon),
          pets: String(profile.pets),
          routeIndex: String(routeIndex),
        });
        const res = await fetch(`/api/route?${params.toString()}`);
        if (!res.ok) throw new Error("route failed");
        const json = (await res.json()) as RouteStatsResponse;
        if (!cancelled) setStats(json);
      } catch {
        if (!cancelled) {
          setStats(null);
          setError("fetch_failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    isHydrated,
    profile.origin,
    profile.destination,
    profile.originLat,
    profile.originLon,
    profile.pets,
    destLat,
    destLon,
    profileVersion,
    routeIndex,
  ]);

  return {
    stats,
    loading,
    error,
    routeIndex,
    setRouteIndex,
    vehicleCount: Math.max(1, vehicles.length),
  };
}
