"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, DivIcon, LayerGroup, Polyline } from "leaflet";
import { MOVE_ROUTE_POINTS, type GeoPoint } from "@/lib/geo/coordinates";
import type { RouteAlternativeSummary } from "@/hooks/use-route-stats";
import type { RouteStop } from "@/lib/types";
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

const ROUTE_COLORS = ["#0D9488", "#6366F1", "#F59E0B"];

interface RouteMapProps {
  className?: string;
  origin?: GeoPoint;
  destination?: GeoPoint;
  showNewHome?: boolean;
  newHome?: GeoPoint;
  alternatives?: RouteAlternativeSummary[];
  selectedRouteIndex?: number;
  onSelectRoute?: (index: number) => void;
  stops?: RouteStop[];
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

function stopEmoji(type: RouteStop["type"]): string {
  switch (type) {
    case "gas":
      return "⛽";
    case "hotel":
      return "🏨";
    case "pet_hotel":
      return "🐾";
    default:
      return "📍";
  }
}

function findSelectedRoute(
  alternatives: RouteAlternativeSummary[],
  selectedRouteIndex: number
): RouteAlternativeSummary | null {
  if (!alternatives.length) return null;
  return (
    alternatives.find((a) => a.index === selectedRouteIndex) ??
    alternatives[selectedRouteIndex] ??
    null
  );
}

export function RouteMap({
  className,
  origin: originProp,
  destination: destinationProp,
  showNewHome = true,
  newHome,
  alternatives = [],
  selectedRouteIndex = 0,
  onSelectRoute,
  stops = [],
}: RouteMapProps) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  // Leaflet default export (dynamic import)
  const leafletRef = useRef<{
    map: typeof import("leaflet").map;
    tileLayer: typeof import("leaflet").tileLayer;
    marker: typeof import("leaflet").marker;
    circleMarker: typeof import("leaflet").circleMarker;
    layerGroup: typeof import("leaflet").layerGroup;
    latLngBounds: typeof import("leaflet").latLngBounds;
    polyline: typeof import("leaflet").polyline;
    divIcon: typeof import("leaflet").divIcon;
    Icon: typeof import("leaflet").Icon;
  } | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const routeLineRef = useRef<Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [weatherCount, setWeatherCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const origin = originProp ?? MOVE_ROUTE_POINTS.origin;
  const destination = destinationProp ?? MOVE_ROUTE_POINTS.destination;
  const homePoint = newHome ?? MOVE_ROUTE_POINTS.newHome;
  const selectedRoute = findSelectedRoute(alternatives, selectedRouteIndex);

  // Init map shell once per origin/destination
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        routeLayerRef.current = null;
        routeLineRef.current = null;
      }

      leafletRef.current = L;

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

      const map = L.map(containerRef.current, { scrollWheelZoom: true, zoomControl: true });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([origin.lat, origin.lon])
        .addTo(map)
        .bindPopup(`<strong>${t("routePage.origin")}</strong><br>${origin.label}`);

      L.marker([destination.lat, destination.lon])
        .addTo(map)
        .bindPopup(`<strong>${t("routePage.destination")}</strong><br>${destination.label}`);

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
      }

      routeLayerRef.current = L.layerGroup().addTo(map);

      const bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });

      if (!cancelled) {
        setMapReady(true);
        setLoading(false);
      }
    }

    setMapReady(false);
    setLoading(true);
    void initMap();

    return () => {
      cancelled = true;
      setMapReady(false);
      setWeatherCount(0);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      routeLayerRef.current = null;
      routeLineRef.current = null;
      leafletRef.current = null;
    };
  }, [
    origin.lat,
    origin.lon,
    origin.label,
    destination.lat,
    destination.lon,
    destination.label,
    showNewHome,
    homePoint?.lat,
    homePoint?.lon,
    homePoint?.label,
    t,
  ]);

  // Draw ONLY the selected route + its stops (re-run when selection changes)
  useEffect(() => {
    const map = mapRef.current;
    const Lmod = leafletRef.current;
    const layer = routeLayerRef.current;
    if (!mapReady || !map || !Lmod || !layer) return;

    layer.clearLayers();
    routeLineRef.current = null;
    setWeatherCount(0);

    if (!selectedRoute?.coordinates?.length) {
      map.fitBounds(
        Lmod.latLngBounds([
          [origin.lat, origin.lon],
          [destination.lat, destination.lon],
        ]),
        { padding: [40, 40] }
      );
      return;
    }

    const latLngs = selectedRoute.coordinates.map(
      ([lon, lat]) => [lat, lon] as [number, number]
    );
    const color = ROUTE_COLORS[selectedRouteIndex] ?? ROUTE_COLORS[0];

    routeLineRef.current = Lmod.polyline(latLngs, {
      color,
      weight: 5,
      opacity: 0.92,
    }).addTo(layer);

    for (const stop of stops) {
      if (stop.lat == null || stop.lon == null) continue;
      Lmod.marker([stop.lat, stop.lon], {
        icon: Lmod.divIcon({
          className: "route-stop-marker-wrap",
          html: `<div class="route-stop-marker">${stopEmoji(stop.type)}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        zIndexOffset: 500,
      })
        .addTo(layer)
        .bindPopup(
          `<strong>${stop.name}</strong><br>${stop.location}${stop.estimatedPrice ? `<br>~$${stop.estimatedPrice}/night` : ""}${stop.notes ? `<br><small>${stop.notes}</small>` : ""}`
        );
    }

    const bounds = Lmod.latLngBounds([
      [origin.lat, origin.lon],
      [destination.lat, destination.lon],
    ]);
    latLngs.forEach((ll) => bounds.extend(ll));
    map.fitBounds(bounds, { padding: [40, 40] });

    let cancelled = false;

    async function loadWeather() {
      const Lw = Lmod;
      const weatherLayer = layer;
      if (!Lw || !weatherLayer) return;
      try {
        const params = new URLSearchParams({
          originLat: String(origin.lat),
          originLon: String(origin.lon),
          destLat: String(destination.lat),
          destLon: String(destination.lon),
          originLabel: origin.label,
          destLabel: destination.label,
          routeIndex: String(selectedRouteIndex),
        });
        const wRes = await fetch(`/api/weather/along-route?${params.toString()}`);
        if (!wRes.ok || cancelled) return;
        const { points } = (await wRes.json()) as { points: RouteWeatherPoint[] };
        for (const pt of points) {
          if (cancelled) return;
          Lw.marker([pt.lat, pt.lon], {
            icon: createWeatherDivIcon(Lw as typeof import("leaflet"), pt.icon, pt.condition),
            zIndexOffset: 600,
          })
            .addTo(weatherLayer)
            .bindPopup(
              `<strong>${pt.location}</strong><br>${pt.tempF}°F · ${pt.condition}`
            );
        }
        if (!cancelled) setWeatherCount(points.length);
      } catch {
        /* optional */
      }
    }

    void loadWeather();

    return () => {
      cancelled = true;
    };
  }, [
    mapReady,
    selectedRouteIndex,
    selectedRoute,
    stops,
    origin.lat,
    origin.lon,
    origin.label,
    destination.lat,
    destination.lon,
    destination.label,
  ]);

  const handleSelectRoute = useCallback(
    (index: number) => {
      onSelectRoute?.(index);
    },
    [onSelectRoute]
  );

  return (
    <div className={`relative overflow-hidden rounded-xl border ${className ?? ""}`}>
      <style>{`
        .route-weather-marker-wrap, .route-stop-marker-wrap {
          background: transparent !important;
          border: none !important;
        }
        .route-weather-marker, .route-stop-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
          border: 2px solid #14B8A6;
          font-size: 16px;
        }
        .route-stop-marker {
          width: 28px;
          height: 28px;
          border-color: #6366F1;
        }
        .route-weather-marker img { display: block; }
      `}</style>
      <div ref={containerRef} className="h-full min-h-[280px] sm:min-h-[360px] w-full z-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {mapReady && alternatives.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm z-[1000] rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-md backdrop-blur space-y-2">
          {selectedRoute ? (
            <div>
              <span className="font-medium">{selectedRoute.distanceMiles.toFixed(0)} mi</span>
              <span className="text-muted-foreground mx-2">·</span>
              <span>~{selectedRoute.durationHours.toFixed(1)}h drive</span>
            </div>
          ) : (
            <p className="text-muted-foreground">{t("routePage.pickRouteHint")}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {alternatives.slice(0, 3).map((alt) => (
              <button
                key={alt.index}
                type="button"
                onClick={() => handleSelectRoute(alt.index)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                  alt.index === selectedRouteIndex
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border"
                }`}
                style={
                  alt.index !== selectedRouteIndex
                    ? { borderColor: ROUTE_COLORS[alt.index] ?? ROUTE_COLORS[0] }
                    : undefined
                }
              >
                {t("routePage.routeOption", { n: alt.index + 1 })} · {alt.distanceMiles} mi
              </button>
            ))}
          </div>
          {weatherCount > 0 && (
            <p className="text-muted-foreground">{t("weather.mapIconsHint")}</p>
          )}
        </div>
      )}
    </div>
  );
}
