"use client";

import { RouteMap } from "@/components/dashboard/route-map";
import { RouteMapEmptyState } from "@/components/dashboard/route-map-empty-state";
import { useMove } from "@/contexts/move-context";
import { hasRouteCoordinates } from "@/lib/move/profile-completeness";
import type { GeoPoint } from "@/lib/geo/coordinates";

interface RouteMapWrapperProps {
  className?: string;
  showNewHome?: boolean;
}

export function RouteMapWrapper({ className, showNewHome = true }: RouteMapWrapperProps) {
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
      key={`${origin.lat}-${origin.lon}-${destination.lat}-${destination.lon}`}
      className={className}
      origin={origin}
      destination={destination}
      showNewHome={showNewHome && Boolean(newHome)}
      newHome={newHome}
    />
  );
}
