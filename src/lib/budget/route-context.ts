import { estimateBudget } from "@/lib/budget/estimator";
import { fetchRouteStops } from "@/lib/geo/route-stops";
import { loadStoredMoveRoutes } from "@/lib/geo/move-routes-sync";
import {
  computeRouteStatsWithAlternatives,
  resolveRoutePointsFromCityCenter,
  resolveRouteDistanceMiles,
} from "@/lib/geo/route-service";
import type { MoveProfile } from "@/lib/move-profile";
import type { RouteStop } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { enrichVehicleMpg } from "@/lib/vehicles/fuel-economy";
import { prisma } from "@/lib/prisma";

function dbToVehicle(v: {
  id: string;
  year: string;
  makeId: number | null;
  make: string;
  modelId: number | null;
  model: string;
  trim: string | null;
  displayLabel: string;
  needsTransport?: boolean;
  combMpg?: number | null;
  cityMpg?: number | null;
  highwayMpg?: number | null;
  fuelType?: string | null;
  epaVehicleId?: string | null;
}): VehicleInfo {
  return {
    id: v.id,
    year: v.year,
    makeId: v.makeId ?? 0,
    make: v.make,
    modelId: v.modelId ?? 0,
    model: v.model,
    trim: v.trim ?? undefined,
    displayLabel: v.displayLabel,
    needsTransport: v.needsTransport ?? false,
    combMpg: v.combMpg ?? undefined,
    cityMpg: v.cityMpg ?? undefined,
    highwayMpg: v.highwayMpg ?? undefined,
    fuelType: v.fuelType ?? undefined,
    epaVehicleId: v.epaVehicleId ?? undefined,
  };
}

/** Detect legacy bad EV rows where city/highway were stored as kWh/100mi instead of MPGe. */
function needsMpgRefresh(info: VehicleInfo): boolean {
  if (!info.combMpg || info.combMpg <= 0) return true;
  if (info.fuelType && /electric/i.test(info.fuelType)) {
    if ((info.cityMpg ?? 0) > 0 && (info.cityMpg ?? 0) < 40 && (info.combMpg ?? 0) > 60) {
      return true;
    }
  }
  return false;
}

export async function loadVehiclesWithMpg(moveId: string): Promise<VehicleInfo[]> {
  const rows = await prisma.vehicle.findMany({ where: { moveId } });
  return Promise.all(
    rows.map(async (row) => {
      const info = dbToVehicle(row);
      if (!needsMpgRefresh(info)) return info;
      const enriched = await enrichVehicleMpg(info, { force: true });
      if (enriched.combMpg && enriched.combMpg > 0) {
        await prisma.vehicle.update({
          where: { id: row.id },
          data: {
            combMpg: enriched.combMpg,
            cityMpg: enriched.cityMpg ?? null,
            highwayMpg: enriched.highwayMpg ?? null,
            fuelType: enriched.fuelType ?? null,
            epaVehicleId: enriched.epaVehicleId ?? null,
          },
        });
      }
      return enriched;
    })
  );
}

export interface BudgetRouteContext {
  distanceMiles: number;
  durationHours?: number;
  routeStops: RouteStop[];
  vehicles: VehicleInfo[];
}

export async function resolveBudgetRouteContext(
  moveId: string,
  profile: MoveProfile,
  routeIndex = 0
): Promise<BudgetRouteContext> {
  const vehicles = await loadVehiclesWithMpg(moveId);
  const points = await resolveRoutePointsFromCityCenter(profile);
  let distanceMiles: number | undefined;
  let durationHours: number | undefined;
  let routeStops: RouteStop[] = [];

  if (points) {
    const stored = await loadStoredMoveRoutes(moveId);
    const storedAlt = stored?.alternatives[routeIndex] ?? stored?.alternatives[0];

    if (storedAlt) {
      distanceMiles = storedAlt.distanceMiles;
      durationHours = storedAlt.durationHours;
      const storedStops = stored?.stopsByIndex[routeIndex] ?? stored?.stopsByIndex[0];
      if (storedStops?.length) {
        routeStops = storedStops;
      } else {
        routeStops = await fetchRouteStops(
          {
            distanceMiles,
            durationHours,
            driveTimeLabel: storedAlt.driveTimeLabel,
            stopCount: 0,
            geometry: {
              coordinates: storedAlt.coordinates,
              distanceMiles: storedAlt.distanceMiles,
              durationHours: storedAlt.durationHours,
            },
          },
          profile,
          {
            vehicles,
            rentalPreference: profile.rentalPreference,
            vehicleCount: Math.max(1, vehicles.length),
          }
        );
      }
    } else {
      const stats = await computeRouteStatsWithAlternatives(points.from, points.to, profile.pets);
      const route = stats?.alternatives[routeIndex] ?? stats?.alternatives[0];
      if (route && stats) {
        distanceMiles = Math.round(route.distanceMiles);
        durationHours = route.durationHours;
        routeStops = await fetchRouteStops(
          {
            distanceMiles,
            durationHours,
            driveTimeLabel: stats.driveTimeLabel,
            stopCount: stats.stopCount,
            geometry: route,
          },
          profile,
          {
            vehicles,
            rentalPreference: profile.rentalPreference,
            vehicleCount: Math.max(1, vehicles.length),
          }
        );
      }
    }
  }

  if (distanceMiles == null) {
    distanceMiles = (await resolveRouteDistanceMiles(profile, undefined, undefined, routeIndex)) ?? 800;
  }

  return {
    distanceMiles,
    durationHours,
    routeStops,
    vehicles,
  };
}

export async function estimateBudgetForMove(
  moveId: string,
  profile: MoveProfile,
  options: {
    routeIndex?: number;
    truckChoice?: string | null;
    vehicleTransportChoice?: string | null;
    locale?: "en" | "es";
  } = {}
) {
  const routeIndex = options.routeIndex ?? 0;
  const ctx = await resolveBudgetRouteContext(moveId, profile, routeIndex);
  return estimateBudget(profile, {
    distanceMiles: ctx.distanceMiles,
    durationHours: ctx.durationHours,
    routeStops: ctx.routeStops,
    vehicleCount: Math.max(1, ctx.vehicles.length),
    vehicles: ctx.vehicles,
    truckChoice: options.truckChoice,
    vehicleTransportChoice: options.vehicleTransportChoice,
    locale: options.locale,
  });
}
