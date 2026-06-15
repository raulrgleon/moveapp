"use client";

import { RouteMap } from "@/components/dashboard/route-map";
import { RouteMapEmptyState } from "@/components/dashboard/route-map-empty-state";
import type { RouteAlternativeSummary } from "@/hooks/use-route-stats";
import { useMove } from "@/contexts/move-context";
import { hasRouteCoordinates } from "@/lib/move/profile-completeness";
import type { GeoPoint } from "@/lib/geo/coordinates";
import type { RouteStop } from "@/lib/types";

interface RouteMapWrapperProps {
  className?: string;
  showNewHome?: boolean;
  alternatives?: RouteAlternativeSummary[];
  selectedRouteIndex?: number;
  onSelectRoute?: (index: number) => void;
  stops?: RouteStop[];
}

export function RouteMapWrapper({
  className,
  showNewHome = true,
  alternatives,
  selectedRouteIndex = 0,
  onSelectRoute,
  stops,
}: RouteMapWrapperProps) {
  const { profile, isAddressConfirmed, destinationAddress, lat, lon } = useMove();

  if (!hasRouteCoordinates(profile)) {
    return <RouteMapEmptyState className={className} />;
  }

  const origin: GeoPoint = {
    lat: profile.originLat!,
    lon: profile.originLon!,
    label: profile.origin,
  };

  const destination: GeoPoint =
    isAddressConfirmed && lat != null && lon != null
      ? { lat, lon, label: destinationAddress }
      : {
          lat: profile.destinationLat!,
          lon: profile.destinationLon!,
          label: profile.destination,
        };

  const newHome =
    isAddressConfirmed && lat != null && lon != null
      ? { lat, lon, label: destinationAddress }
      : undefined;

  return (
    <RouteMap
      className={className}
      origin={origin}
      destination={destination}
      showNewHome={showNewHome && Boolean(newHome)}
      newHome={newHome}
      alternatives={alternatives ?? []}
      selectedRouteIndex={selectedRouteIndex}
      onSelectRoute={onSelectRoute}
      stops={stops}
    />
  );
}
