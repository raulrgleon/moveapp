"use client";

import { useEffect, useState } from "react";
import { useMove } from "@/contexts/move-context";
import type { RouteStop } from "@/lib/types";

export interface RouteStatsResponse {
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  stopCount: number;
  stops: RouteStop[];
}

export function useRouteStats() {
  const { profile, lat, lon, isHydrated, profileVersion } = useMove();
  const [stats, setStats] = useState<RouteStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const destLat = profile.destinationLat ?? lat;
  const destLon = profile.destinationLon ?? lon;

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
  ]);

  return { stats, loading, error };
}
