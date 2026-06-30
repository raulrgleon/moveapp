"use client";

import { useEffect } from "react";
import { useMove } from "@/contexts/move-context";
import { useAuth } from "@/contexts/auth-context";
import { prefetchRouteSession } from "@/hooks/use-route-stats";

/** Preloads all route alternatives + stops as soon as the move session is ready. */
export function RouteStatsPrefetch() {
  const {
    profile,
    lat,
    lon,
    isHydrated,
    selectedRouteIndex,
    profileVersion,
  } = useMove();
  const { isAuthenticated, user, isHydrated: authHydrated } = useAuth();
  const useStoredRoutes = authHydrated && isAuthenticated && user?.role !== "admin";

  useEffect(() => {
    if (!isHydrated || !authHydrated) return;

    const destLat = profile.destinationLat ?? lat;
    const destLon = profile.destinationLon ?? lon;
    if (
      !useStoredRoutes &&
      (profile.originLat == null ||
        profile.originLon == null ||
        destLat == null ||
        destLon == null)
    ) {
      return;
    }

    void prefetchRouteSession({
      profile,
      destLat: destLat ?? 0,
      destLon: destLon ?? 0,
      selectedRouteIndex,
      useStoredRoutes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, authHydrated, profile, lat, lon, profileVersion, selectedRouteIndex, useStoredRoutes]);

  return null;
}
