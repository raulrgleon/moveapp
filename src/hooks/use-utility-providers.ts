"use client";

import { useEffect, useState } from "react";
import { useMove } from "@/contexts/move-context";
import { useLocale } from "@/contexts/locale-context";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";
import type { DestinationUtilityProvider } from "@/lib/types";

interface UtilityLoadResult {
  providers: DestinationUtilityProvider[];
  summary: string;
  loading: boolean;
  error: boolean;
  isPrecise: boolean;
  hasLocation: boolean;
}

export function useUtilityProviders(): UtilityLoadResult {
  const { locale } = useLocale();
  const {
    profile,
    isAddressConfirmed,
    destinationAddress,
    lat,
    lon,
    profileVersion,
    isHydrated,
  } = useMove();

  const [providers, setProviders] = useState<DestinationUtilityProvider[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const utilityLat = lat ?? profile.destinationLat;
  const utilityLon = lon ?? profile.destinationLon;
  const utilityAddress = isAddressConfirmed
    ? destinationAddress
    : profile.destination;
  const hasLocation = utilityLat != null && utilityLon != null;
  const isPrecise = isAddressConfirmed;

  useEffect(() => {
    if (!isHydrated || !hasLocation) {
      setProviders([]);
      setSummary("");
      setError(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          lat: String(utilityLat),
          lon: String(utilityLon),
          address: utilityAddress,
          locale,
        });
        const res = await fetch(`/api/utilities?${params}`, { credentials: "include" });
        if (!res.ok) throw new Error("utilities failed");
        const data = (await res.json()) as {
          providers: DestinationUtilityProvider[];
          summary: string;
        };
        if (!cancelled) {
          setProviders(data.providers);
          setSummary(data.summary);
        }
      } catch {
        if (!cancelled) {
          setProviders([]);
          setSummary("");
          setError(true);
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
    hasLocation,
    utilityLat,
    utilityLon,
    utilityAddress,
    locale,
    profileVersion,
  ]);

  useEffect(() => {
    if (!isHydrated || !hasLocation) return;
    return subscribeProfileUpdated(() => {
      void fetch(
        `/api/utilities?${new URLSearchParams({
          lat: String(utilityLat),
          lon: String(utilityLon),
          address: utilityAddress,
          locale,
        }).toString()}`,
        { credentials: "include" }
      )
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: { providers: DestinationUtilityProvider[]; summary: string }) => {
          setProviders(data.providers);
          setSummary(data.summary);
        })
        .catch(() => {});
    });
  }, [isHydrated, hasLocation, utilityLat, utilityLon, utilityAddress, locale]);

  return { providers, summary, loading, error, isPrecise, hasLocation };
}
