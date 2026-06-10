"use client";

import { RouteMap } from "@/components/dashboard/route-map";
import { useMove } from "@/contexts/move-context";

interface RouteMapWrapperProps {
  className?: string;
  showNewHome?: boolean;
}

export function RouteMapWrapper({ className, showNewHome = true }: RouteMapWrapperProps) {
  const { isAddressConfirmed, destinationAddress, lat, lon } = useMove();

  const newHome =
    isAddressConfirmed && lat && lon
      ? { lat, lon, label: destinationAddress }
      : undefined;

  return (
    <RouteMap
      key={newHome ? `${newHome.lat}-${newHome.lon}` : "default"}
      className={className}
      showNewHome={showNewHome && Boolean(newHome)}
      newHome={newHome}
    />
  );
}
