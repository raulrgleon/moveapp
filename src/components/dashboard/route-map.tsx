"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import {
  fetchOsrmRoute,
  MOVE_ROUTE_POINTS,
  type GeoPoint,
  type RouteGeometry,
} from "@/lib/geo/coordinates";
import { Loader2 } from "lucide-react";

interface RouteMapProps {
  className?: string;
  showNewHome?: boolean;
  newHome?: GeoPoint;
}

export function RouteMap({
  className,
  showNewHome = true,
  newHome,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteGeometry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current || mapRef.current) return;

      // Fix default marker icons in bundlers
      const iconProto = L.Icon.Default.prototype as L.Icon.Default & {
        _getIconUrl?: string;
      };
      delete iconProto._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const { origin, destination } = MOVE_ROUTE_POINTS;
      const homePoint = newHome ?? MOVE_ROUTE_POINTS.newHome;

      const route = await fetchOsrmRoute(origin, destination);
      if (cancelled) return;

      setRouteInfo(route);
      setLoading(false);

      const map = L.map(containerRef.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      });

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([origin.lat, origin.lon])
        .addTo(map)
        .bindPopup(`<strong>Origin</strong><br>${origin.label}`);

      L.marker([destination.lat, destination.lon])
        .addTo(map)
        .bindPopup(`<strong>Destination</strong><br>${destination.label}`);

      const bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ]);

      if (showNewHome && homePoint) {
        L.circleMarker([homePoint.lat, homePoint.lon], {
          radius: 8,
          color: "#0D9488",
          fillColor: "#14B8A6",
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(`<strong>New home</strong><br>${homePoint.label}`);
        bounds.extend([homePoint.lat, homePoint.lon]);
      }

      if (route?.coordinates.length) {
        const latLngs = route.coordinates.map(
          ([lon, lat]) => [lat, lon] as [number, number]
        );
        L.polyline(latLngs, {
          color: "#0D9488",
          weight: 4,
          opacity: 0.85,
        }).addTo(map);
        latLngs.forEach((ll) => bounds.extend(ll));
      } else {
        L.polyline(
          [
            [origin.lat, origin.lon],
            [destination.lat, destination.lon],
          ],
          { color: "#0D9488", weight: 3, dashArray: "8 8", opacity: 0.7 }
        ).addTo(map);
      }

      map.fitBounds(bounds, { padding: [40, 40] });
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showNewHome, newHome?.lat, newHome?.lon, newHome?.label]);

  return (
    <div className={`relative overflow-hidden rounded-xl border ${className ?? ""}`}>
      <div ref={containerRef} className="h-full min-h-[280px] sm:min-h-[360px] w-full z-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {routeInfo && !loading && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-auto z-[400] rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-md backdrop-blur">
          <span className="font-medium">
            {routeInfo.distanceMiles.toFixed(0)} mi
          </span>
          <span className="text-muted-foreground mx-2">·</span>
          <span>
            ~{routeInfo.durationHours.toFixed(1)}h drive
          </span>
          <span className="text-muted-foreground mx-2 hidden sm:inline">·</span>
          <span className="hidden sm:inline text-muted-foreground">OSM + OSRM</span>
        </div>
      )}
    </div>
  );
}
