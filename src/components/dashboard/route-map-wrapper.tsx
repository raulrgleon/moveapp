"use client";

import { RouteMap } from "@/components/dashboard/route-map";
import { useMove } from "@/contexts/move-context";
import { MOVE_ROUTE_POINTS, type GeoPoint } from "@/lib/geo/coordinates";

interface RouteMapWrapperProps {
  className?: string;
  showNewHome?: boolean;
}

export function RouteMapWrapper({ className, showNewHome = true }: RouteMapWrapperProps) {
  const { profile, isAddressConfirmed, destinationAddress, lat, lon } = useMove();

  const origin: GeoPoint =
    profile.originLat != null && profile.originLon != null
      ? { lat: profile.originLat, lon: profile.originLon, label: profile.origin }
      : MOVE_ROUTE_POINTS.origin;

  const destination: GeoPoint =
    isAddressConfirmed && lat != null && lon != null
      ? { lat, lon, label: destinationAddress }
      : profile.destinationLat != null && profile.destinationLon != null
        ? {
            lat: profile.destinationLat,
            lon: profile.destinationLon,
            label: profile.destination,
          }
        : MOVE_ROUTE_POINTS.destination;

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
