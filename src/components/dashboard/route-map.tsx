"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, DivIcon } from "leaflet";
import {
  fetchOsrmRoute,
  MOVE_ROUTE_POINTS,
  type GeoPoint,
  type RouteGeometry,
} from "@/lib/geo/coordinates";
import { useT } from "@/contexts/locale-context";
import { Loader2 } from "lucide-react";

interface RouteWeatherPoint {
  lat: number;
  lon: number;
  location: string;
  tempF: number;
  condition: string;
  icon: string;
}

interface RouteMapProps {
  className?: string;
  origin?: GeoPoint;
  destination?: GeoPoint;
  showNewHome?: boolean;
  newHome?: GeoPoint;
}

function createWeatherDivIcon(
  L: typeof import("leaflet"),
  iconUrl: string,
  condition: string
): DivIcon {
  const safeCondition = condition.replace(/"/g, "&quot;");
  return L.divIcon({
    className: "route-weather-marker-wrap",
    html: `<div class="route-weather-marker" title="${safeCondition}"><img src="${iconUrl}" width="28" height="28" alt="${safeCondition}" /></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export function RouteMap({
  className,
  origin: originProp,
  destination: destinationProp,
  showNewHome = true,
  newHome,
}: RouteMapProps) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteGeometry | null>(null);
  const [weatherCount, setWeatherCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current || mapRef.current) return;

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

      const origin = originProp ?? MOVE_ROUTE_POINTS.origin;
      const destination = destinationProp ?? MOVE_ROUTE_POINTS.destination;
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

        try {
          const params = new URLSearchParams({
            originLat: String(origin.lat),
            originLon: String(origin.lon),
            destLat: String(destination.lat),
            destLon: String(destination.lon),
            originLabel: origin.label,
            destLabel: destination.label,
          });
          const wRes = await fetch(`/api/weather/along-route?${params.toString()}`);
          if (wRes.ok && !cancelled) {
            const { points } = (await wRes.json()) as { points: RouteWeatherPoint[] };
            for (const pt of points) {
              L.marker([pt.lat, pt.lon], {
                icon: createWeatherDivIcon(L, pt.icon, pt.condition),
                zIndexOffset: 600,
              })
                .addTo(map)
                .bindPopup(
                  `<strong>${pt.location}</strong><br>${pt.tempF}°F · ${pt.condition}`
                );
            }
            if (!cancelled) setWeatherCount(points.length);
          }
        } catch {
          /* weather icons optional */
        }
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

    void initMap();

    return () => {
      cancelled = true;
      setWeatherCount(0);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [
    showNewHome,
    newHome?.lat,
    newHome?.lon,
    newHome?.label,
    originProp?.lat,
    originProp?.lon,
    originProp?.label,
    destinationProp?.lat,
    destinationProp?.lon,
    destinationProp?.label,
  ]);

  return (
    <div className={`relative overflow-hidden rounded-xl border ${className ?? ""}`}>
      <style>{`
        .route-weather-marker-wrap {
          background: transparent !important;
          border: none !important;
        }
        .route-weather-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
          border: 2px solid #14B8A6;
        }
        .route-weather-marker img {
          display: block;
        }
      `}</style>
      <div ref={containerRef} className="h-full min-h-[280px] sm:min-h-[360px] w-full z-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {routeInfo && !loading && (
        <div className="absolute bottom-3 left-3 right-16 sm:left-auto sm:right-3 sm:max-w-xs z-[1000] rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-md backdrop-blur space-y-1">
          <div>
            <span className="font-medium">{routeInfo.distanceMiles.toFixed(0)} mi</span>
            <span className="text-muted-foreground mx-2">·</span>
            <span>~{routeInfo.durationHours.toFixed(1)}h drive</span>
          </div>
          {weatherCount > 0 && (
            <p className="text-muted-foreground">{t("weather.mapIconsHint")}</p>
          )}
        </div>
      )}
    </div>
  );
}
