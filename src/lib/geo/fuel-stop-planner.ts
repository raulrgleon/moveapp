import type { RentalPreferenceKey } from "@/lib/move-profile";
import { parseRentalPreferenceKey } from "@/lib/move-profile";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { mpgForVehicle } from "@/lib/vehicles/fuel-economy";
import { drivenVehicleCount, mpgForRental } from "@/lib/budget/fuel-cost";

/** Refuel / recharge when remaining capacity drops to this fraction. */
const FUEL_RESERVE_FRACTION = 0.15;
const MAX_FUEL_STOPS = 8;
const MIN_MILES_BEFORE_DEST = 25;

export interface FuelStopMarker {
  mile: number;
  mpg: number;
  tankGallons: number;
  gallonsNeeded: number;
  isElectric: boolean;
  vehicleLabel: string;
}

export interface FuelStopPlannerInput {
  distanceMiles: number;
  rentalPreference: string;
  vehicles?: VehicleInfo[];
  vehicleCount?: number;
}

function isElectricVehicle(vehicle: VehicleInfo): boolean {
  return /electric|bev|battery/i.test(vehicle.fuelType ?? "");
}

function vehicleHaystack(vehicle: VehicleInfo): string {
  return `${vehicle.make} ${vehicle.model} ${vehicle.displayLabel}`.toLowerCase();
}

/** Estimated usable tank (gallons) when EPA does not provide it. */
export function estimateTankGallons(
  vehicle: VehicleInfo | null,
  rentalKey: RentalPreferenceKey
): number {
  if (rentalKey === "truck") return 40;

  if (!vehicle) return 16;

  const hay = vehicleHaystack(vehicle);
  if (/f-250|f250|super duty|2500|3500|heavy duty/i.test(hay)) return 34;
  if (/f-150|f150|silverado|sierra|ram 1500|tundra|titan|frontier|colorado|ranger/i.test(hay)) {
    return 26;
  }
  if (/suburban|expedition max|sequoia|tahoe|yukon|navigator|escalade/i.test(hay)) return 28;
  if (/pilot|highlander|explorer|4runner|grand cherokee|traverse|atlas|palisade|telluride/i.test(hay)) {
    return 19.5;
  }
  if (/civic|corolla|mazda3|elantra|sentra|impreza|versa/i.test(hay)) return 12.4;

  const mpg = mpgForVehicle(vehicle);
  if (mpg >= 32) return 13.5;
  if (mpg >= 26) return 15.5;
  if (mpg >= 20) return 18;
  if (mpg >= 15) return 22;
  return 26;
}

function mpgForDrivingVehicle(
  vehicle: VehicleInfo,
  rentalKey: RentalPreferenceKey
): number {
  if (rentalKey === "trailer" || rentalKey === "combo") {
    return Math.round(mpgForVehicle(vehicle) * 0.72 * 10) / 10;
  }
  return mpgForVehicle(vehicle);
}

function evRangeMiles(vehicle: VehicleInfo): number {
  if (vehicle.combMpg && vehicle.combMpg > 60) {
    return Math.round(Math.min(360, Math.max(130, vehicle.combMpg * 2.2)));
  }
  return 240;
}

function drivingVehicles(
  rentalKey: RentalPreferenceKey,
  vehicles: VehicleInfo[]
): VehicleInfo[] {
  if (rentalKey === "movers") return [];
  if (rentalKey === "truck") {
    return [
      {
        id: "rental-truck",
        year: "",
        makeId: 0,
        make: "Rental",
        modelId: 0,
        model: "Moving truck",
        displayLabel: "Rental moving truck",
        combMpg: 10,
        highwayMpg: 11,
        cityMpg: 8,
        fuelType: "Regular",
      },
    ];
  }
  const configured = vehicles.filter((v) => v.make?.trim() && v.model?.trim() && !v.needsTransport);
  return configured.length ? configured : vehicles.filter((v) => v.make?.trim() && v.model?.trim());
}

interface LegRange {
  milesPerLeg: number;
  mpg: number;
  tankGallons: number;
  isElectric: boolean;
  vehicleLabel: string;
  gallonsPerLeg: number;
}

function computeLegRange(
  rentalKey: RentalPreferenceKey,
  vehicles: VehicleInfo[],
  vehicleCount: number
): LegRange | null {
  if (rentalKey === "movers" || drivenVehicleCount(rentalKey, vehicleCount, vehicles) === 0) {
    return null;
  }

  const drivers = drivingVehicles(rentalKey, vehicles);
  if (!drivers.length) {
    const mpg = mpgForRental(rentalKey, vehicles);
    const tank = estimateTankGallons(null, rentalKey);
    const milesPerLeg = tank * mpg * (1 - FUEL_RESERVE_FRACTION);
    return {
      milesPerLeg,
      mpg,
      tankGallons: tank,
      isElectric: false,
      vehicleLabel: rentalKey === "truck" ? "Rental truck" : "Your vehicle",
      gallonsPerLeg: tank * (1 - FUEL_RESERVE_FRACTION),
    };
  }

  const legs = drivers.map((vehicle) => {
    const mpg = mpgForDrivingVehicle(vehicle, rentalKey);
    if (isElectricVehicle(vehicle)) {
      const range = evRangeMiles(vehicle);
      const milesPerLeg = range * (1 - FUEL_RESERVE_FRACTION);
      return {
        milesPerLeg,
        mpg,
        tankGallons: range / Math.max(mpg, 1),
        isElectric: true,
        vehicleLabel: vehicle.displayLabel,
        gallonsPerLeg: milesPerLeg / Math.max(mpg, 1),
      };
    }
    const tank = estimateTankGallons(vehicle, rentalKey);
    const milesPerLeg = tank * mpg * (1 - FUEL_RESERVE_FRACTION);
    return {
      milesPerLeg,
      mpg,
      tankGallons: tank,
      isElectric: false,
      vehicleLabel: vehicle.displayLabel,
      gallonsPerLeg: tank * (1 - FUEL_RESERVE_FRACTION),
    };
  });

  const limiting = legs.reduce((min, leg) => (leg.milesPerLeg < min.milesPerLeg ? leg : min));
  const gallonsPerLeg = legs.reduce((sum, leg) => sum + leg.gallonsPerLeg, 0);

  return {
    ...limiting,
    gallonsPerLeg: Math.round(gallonsPerLeg * 10) / 10,
    vehicleLabel:
      drivers.length === 1
        ? limiting.vehicleLabel
        : `${drivers.length} vehicles (${limiting.vehicleLabel} limits range)`,
  };
}

/** Mile markers along the route where fuel/charging stops are needed. */
export function computeFuelStopMarkers(input: FuelStopPlannerInput): FuelStopMarker[] {
  const miles = Math.max(0, input.distanceMiles);
  if (miles < 80) return [];

  const rentalKey = parseRentalPreferenceKey(input.rentalPreference ?? "own");
  const vehicles = input.vehicles ?? [];
  const vehicleCount = input.vehicleCount ?? Math.max(1, vehicles.length);

  const leg = computeLegRange(rentalKey, vehicles, vehicleCount);
  if (!leg || leg.milesPerLeg < 40) return [];

  const markers: FuelStopMarker[] = [];
  let mile = leg.milesPerLeg;

  while (mile < miles - MIN_MILES_BEFORE_DEST && markers.length < MAX_FUEL_STOPS) {
    markers.push({
      mile: Math.round(mile),
      mpg: leg.mpg,
      tankGallons: leg.tankGallons,
      gallonsNeeded: leg.gallonsPerLeg,
      isElectric: leg.isElectric,
      vehicleLabel: leg.vehicleLabel,
    });
    mile += leg.milesPerLeg;
  }

  return markers;
}

export function computeFuelStopMiles(input: FuelStopPlannerInput): number[] {
  return computeFuelStopMarkers(input).map((m) => m.mile);
}

export function formatFuelStopNote(
  marker: FuelStopMarker,
  mile: number,
  originLabel: string,
  locale: "en" | "es" = "en"
): string {
  if (marker.isElectric) {
    return locale === "es"
      ? `~${mile} mi · Recarga (~${Math.round(marker.gallonsNeeded * 33.7)} kWh equiv.) · ${marker.vehicleLabel} · ~${Math.round(marker.mpg)} MPGe`
      : `~${mile} mi · Charge stop (~${Math.round(marker.gallonsNeeded * 33.7)} kWh equiv.) · ${marker.vehicleLabel} · ~${Math.round(marker.mpg)} MPGe`;
  }
  return locale === "es"
    ? `~${mile} mi desde ${originLabel} · ~${marker.gallonsNeeded.toFixed(0)} gal (${marker.vehicleLabel}, ~${marker.mpg} MPG) · Repostar con ~${Math.round(FUEL_RESERVE_FRACTION * 100)}% restante`
    : `~${mile} mi from ${originLabel} · ~${marker.gallonsNeeded.toFixed(0)} gal (${marker.vehicleLabel}, ~${marker.mpg} MPG) · Refuel with ~${Math.round(FUEL_RESERVE_FRACTION * 100)}% tank left`;
}
