"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, CircleMarker, DivIcon, LayerGroup, Marker, Polyline } from "leaflet";
import { MOVE_ROUTE_POINTS, type GeoPoint } from "@/lib/geo/coordinates";
import { computeTravelDays } from "@/lib/geo/route-service";
import { encodeRouteCoords, escapeHtml } from "@/lib/geo/escape-html";
import type { RouteAlternativeSummary } from "@/hooks/use-route-stats";
import type { RouteStop } from "@/lib/types";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
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
  /** When true (cinematic mode), map recalculates size to fill container. */
  expanded?: boolean;
}

function createWeatherDivIcon(
  L: typeof import("leaflet"),
  iconUrl: string,
  condition: string
): DivIcon {
  const safeCondition = escapeHtml(condition);
  const safeUrl = escapeHtml(iconUrl);
  return L.divIcon({
    className: "route-weather-marker-wrap",
    html: `<div class="route-weather-marker" title="${safeCondition}"><img src="${safeUrl}" width="28" height="28" alt="${safeCondition}" loading="lazy" /></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function stopEmoji(type: RouteStop["type"], isElectric?: boolean, restStopKind?: RouteStop["restStopKind"]): string {
  if (type === "gas") return isElectric ? "⚡" : "⛽";
  switch (type) {
    case "hotel":
      return "🏨";
    case "pet_hotel":
      return "🐾";
    case "rest":
      if (restStopKind === "gas_station") return "⛽";
      if (restStopKind === "services" || restStopKind === "rest_area") return "🛣️";
      return "🚻";
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

function usePrefersTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 768px)");
    const update = () => setTouch(mq.matches);
    update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    // Safari/iOS older versions use addListener/removeListener.
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);
  return touch;
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
  expanded = false,
}: RouteMapProps) {
  const t = useT();
  const prefersTouch = usePrefersTouch();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const weatherLayerRef = useRef<LayerGroup | null>(null);
  const routeLineRef = useRef<Polyline | null>(null);
  const originMarkerRef = useRef<Marker | null>(null);
  const destMarkerRef = useRef<Marker | null>(null);
  const homeMarkerRef = useRef<CircleMarker | null>(null);
  const lastFitRouteRef = useRef<number | null>(null);
  const lastExpandedRef = useRef(expanded);
  const weatherRequestRef = useRef(0);

  const [mapReady, setMapReady] = useState(false);
  const [weatherCount, setWeatherCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const origin = originProp ?? MOVE_ROUTE_POINTS.origin;
  const destination = destinationProp ?? MOVE_ROUTE_POINTS.destination;
  const homePoint = newHome ?? MOVE_ROUTE_POINTS.newHome;
  const selectedRoute = findSelectedRoute(alternatives, selectedRouteIndex);

  const fitMapToRoute = useCallback(() => {
    const map = mapRef.current;
    const Lmod = leafletRef.current;
    if (!map || !Lmod) return;

    const padding: [number, number] = expanded
      ? prefersTouch
        ? [32, 32]
        : [56, 56]
      : prefersTouch
        ? [24, 24]
        : [40, 40];

    if (selectedRoute?.coordinates?.length) {
      const bounds = Lmod.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ]);
      for (const [lon, lat] of selectedRoute.coordinates) {
        bounds.extend([lat, lon]);
      }
      map.fitBounds(bounds, { padding });
      return;
    }

    map.fitBounds(
      Lmod.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ]),
      { padding }
    );
  }, [
    expanded,
    prefersTouch,
    origin.lat,
    origin.lon,
    destination.lat,
    destination.lon,
    selectedRoute,
  ]);

  const invalidateMapSize = useCallback((refit = false) => {
    const map = mapRef.current;
    if (!map) return;
    window.requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
      window.requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
        if (refit) fitMapToRoute();
      });
    });
  }, [fitMapToRoute]);

  // Init map once per coordinate set (not on label/locale changes)
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        routeLayerRef.current = null;
        weatherLayerRef.current = null;
        routeLineRef.current = null;
        originMarkerRef.current = null;
        destMarkerRef.current = null;
        homeMarkerRef.current = null;
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

      const map = L.map(containerRef.current, {
        scrollWheelZoom: !prefersTouch,
        zoomControl: true,
        touchZoom: true,
        dragging: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        keepBuffer: 4,
        updateWhenIdle: false,
      }).addTo(map);

      originMarkerRef.current = L.marker([origin.lat, origin.lon]).addTo(map);
      destMarkerRef.current = L.marker([destination.lat, destination.lon]).addTo(map);

      if (showNewHome && homePoint) {
        homeMarkerRef.current = L.circleMarker([homePoint.lat, homePoint.lon], {
          radius: 8,
          color: "#0D9488",
          fillColor: "#14B8A6",
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(map);
      }

      routeLayerRef.current = L.layerGroup().addTo(map);
      weatherLayerRef.current = L.layerGroup().addTo(map);

      map.fitBounds(
        L.latLngBounds([
          [origin.lat, origin.lon],
          [destination.lat, destination.lon],
        ]),
        { padding: [40, 40] }
      );

      if (!cancelled) {
        setMapReady(true);
        setLoading(false);
        lastFitRouteRef.current = null;
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
      weatherLayerRef.current = null;
      routeLineRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
      homeMarkerRef.current = null;
      leafletRef.current = null;
    };
  }, [
    origin.lat,
    origin.lon,
    destination.lat,
    destination.lon,
    showNewHome,
    homePoint,
    prefersTouch,
  ]);

  // Update marker popups when labels or locale change (no map rebuild)
  useEffect(() => {
    if (!mapReady) return;
    const originPopup = `<strong>${escapeHtml(t("routePage.origin"))}</strong><br>${escapeHtml(origin.label)}`;
    const destPopup = `<strong>${escapeHtml(t("routePage.destination"))}</strong><br>${escapeHtml(destination.label)}`;
    originMarkerRef.current?.bindPopup(originPopup);
    destMarkerRef.current?.bindPopup(destPopup);
    if (homeMarkerRef.current && homePoint) {
      homeMarkerRef.current.bindPopup(
        `<strong>${escapeHtml(t("routePage.newHome"))}</strong><br>${escapeHtml(homePoint.label)}`
      );
    }
  }, [mapReady, origin.label, destination.label, homePoint, t]);

  // Resize and refit when container or cinematic mode changes
  useEffect(() => {
    if (!mapReady || !containerRef.current) return;
    lastFitRouteRef.current = null;
    invalidateMapSize(true);
    const timers = [80, 200, 450, 900].map((ms) =>
      window.setTimeout(() => invalidateMapSize(true), ms)
    );
    const node = containerRef.current;
    const hasResizeObserver = typeof window.ResizeObserver !== "undefined";
    const ro = hasResizeObserver ? new window.ResizeObserver(() => invalidateMapSize(true)) : null;
    ro?.observe(node);
    return () => {
      ro?.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [mapReady, expanded, invalidateMapSize]);

  // Draw selected route, stops, and weather
  useEffect(() => {
    const map = mapRef.current;
    const Lmod = leafletRef.current;
    const layer = routeLayerRef.current;
    const weatherLayer = weatherLayerRef.current;
    if (!mapReady || !map || !Lmod || !layer || !weatherLayer) return;

    layer.clearLayers();
    weatherLayer.clearLayers();
    routeLineRef.current = null;
    setWeatherCount(0);

    const requestId = ++weatherRequestRef.current;

    if (!selectedRoute?.coordinates?.length) {
      const expandedChanged = lastExpandedRef.current !== expanded;
      lastExpandedRef.current = expanded;
      if (lastFitRouteRef.current !== selectedRouteIndex || expandedChanged) {
        map.fitBounds(
          Lmod.latLngBounds([
            [origin.lat, origin.lon],
            [destination.lat, destination.lon],
          ]),
          { padding: [40, 40] }
        );
        lastFitRouteRef.current = selectedRouteIndex;
      }
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
      smoothFactor: 1.5,
    }).addTo(layer);

    for (const stop of stops) {
      if (stop.lat == null || stop.lon == null) continue;
      const priceLine =
        stop.estimatedPrice != null && stop.estimatedPrice > 0
          ? `<br>~$${escapeHtml(String(stop.estimatedPrice))}/night`
          : "";
      const fuelLines =
        stop.vehicleFills?.length && (stop.type === "gas" || stop.type === "rest")
          ? `<br><small>${stop.vehicleFills
              .map((fill) => {
                if (fill.isElectric && fill.kwhToCharge != null) {
                  return `${escapeHtml(fill.vehicleLabel)}: ~${fill.kwhToCharge} kWh`;
                }
                return `${escapeHtml(fill.vehicleLabel)}: ${fill.gallonsToFill.toFixed(1)} gal`;
              })
              .join("<br>")}</small>`
          : "";
      const notesLine =
        stop.notes && !fuelLines ? `<br><small>${escapeHtml(stop.notes)}</small>` : "";
      Lmod.marker([stop.lat, stop.lon], {
        icon: Lmod.divIcon({
          className: "route-stop-marker-wrap",
          html: `<div class="route-stop-marker">${stopEmoji(stop.type, stop.isElectric, stop.restStopKind)}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        zIndexOffset: 500,
      })
        .addTo(layer)
        .bindPopup(
          `<strong>${escapeHtml(stop.name)}</strong><br>${escapeHtml(stop.location)}${priceLine}${fuelLines}${notesLine}`
        );
    }

    const expandedChanged = lastExpandedRef.current !== expanded;
    lastExpandedRef.current = expanded;

    if (lastFitRouteRef.current !== selectedRouteIndex || expandedChanged) {
      fitMapToRoute();
      lastFitRouteRef.current = selectedRouteIndex;
    }

    async function loadWeather() {
      const wl = weatherLayer;
      const Lw = Lmod;
      if (!wl || !Lw) return;
      try {
        const coords = encodeRouteCoords(selectedRoute!.coordinates);
        const params = new URLSearchParams({
          originLat: String(origin.lat),
          originLon: String(origin.lon),
          destLat: String(destination.lat),
          destLon: String(destination.lon),
          routeIndex: String(selectedRouteIndex),
          coords,
          distanceMiles: String(selectedRoute!.distanceMiles),
        });
        const wRes = await apiFetch(`/api/weather/along-route?${params.toString()}`);
        if (weatherRequestRef.current !== requestId) return;
        const { points } = (await wRes.json()) as { points: RouteWeatherPoint[] };
        if (weatherRequestRef.current !== requestId) return;

        wl.clearLayers();
        for (const pt of points) {
          Lw.marker([pt.lat, pt.lon], {
            icon: createWeatherDivIcon(Lw, pt.icon, pt.condition),
            zIndexOffset: 600,
          })
            .addTo(wl)
            .bindPopup(
              `<strong>${escapeHtml(pt.location)}</strong><br>${escapeHtml(String(pt.tempF))}°F · ${escapeHtml(pt.condition)}`
            );
        }
        setWeatherCount(points.length);
      } catch {
        /* optional */
      }
    }

    void loadWeather();
  }, [
    mapReady,
    selectedRouteIndex,
    selectedRoute,
    stops,
    origin.lat,
    origin.lon,
    destination.lat,
    destination.lon,
    prefersTouch,
    fitMapToRoute,
    expanded,
  ]);

  const handleSelectRoute = useCallback(
    (index: number) => {
      onSelectRoute?.(index);
    },
    [onSelectRoute]
  );

  const driveHoursLabel = selectedRoute
    ? t("routePage.driveHours", { hours: selectedRoute.durationHours.toFixed(1) })
    : null;
  const travelDaysLabel = selectedRoute
    ? (() => {
        const days = computeTravelDays(selectedRoute.durationHours);
        return days === 1
          ? t("routePage.travelDayOne")
          : t("routePage.travelDays", { days });
      })()
    : null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${
        expanded ? "flex h-full min-h-0 flex-1 flex-col" : ""
      } ${className ?? ""}`}
    >
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
        .route-map-container .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .route-map-container .leaflet-control-zoom a {
          width: 36px;
          height: 36px;
          line-height: 36px;
          font-size: 18px;
        }
      `}</style>
      <div
        ref={containerRef}
        className={`route-map-container z-0 w-full ${
          expanded
            ? "h-full min-h-[320px]"
            : "min-h-[min(52dvh,28rem)] sm:min-h-[360px] lg:min-h-[400px]"
        }`}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {mapReady && alternatives.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm z-[1000] rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-md backdrop-blur space-y-2 safe-bottom max-lg:mb-0">
          {selectedRoute ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-medium">
                {selectedRoute.distanceMiles.toFixed(0)} {t("routePage.miles")}
              </span>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-muted-foreground">{driveHoursLabel}</span>
              {travelDaysLabel && (
                <>
                  <span className="text-muted-foreground hidden sm:inline">·</span>
                  <span className="font-medium">{travelDaysLabel}</span>
                </>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("routePage.pickRouteHint")}</p>
          )}
          {/* Route pills on map for mobile/tablet; desktop uses card below */}
          <div className="flex flex-wrap gap-1.5 lg:hidden">
            {alternatives.slice(0, 3).map((alt) => (
              <button
                key={alt.index}
                type="button"
                onClick={() => handleSelectRoute(alt.index)}
                className={`rounded-full px-2.5 py-1.5 text-xs font-medium border transition-colors min-h-[36px] ${
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
                {t("routePage.routeOption", { n: alt.index + 1 })} · {alt.distanceMiles}{" "}
                {t("routePage.miles")}
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
