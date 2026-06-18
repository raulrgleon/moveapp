import type { RentalPreferenceKey } from "@/lib/move-profile";
import { parseRentalPreferenceKey } from "@/lib/move-profile";
import type { VehicleFuelFill } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { mpgForVehicle } from "@/lib/vehicles/fuel-economy";
import { drivenVehicleCount, mpgForRental } from "@/lib/budget/fuel-cost";

/** Refuel / recharge when remaining capacity drops to this fraction. */
const FUEL_RESERVE_FRACTION = 0.15;
const MAX_FUEL_STOPS = 8;
const MIN_MILES_BEFORE_DEST = 25;
const KWH_PER_GALLON_GAS = 33.7;

export interface FuelStopMarker {
  mile: number;
  mpg: number;
  tankGallons: number;
  gallonsNeeded: number;
  isElectric: boolean;
  vehicleLabel: string;
  vehicleFills: VehicleFuelFill[];
  legMiles: number;
}

export interface FuelStopPlannerInput {
  distanceMiles: number;
  rentalPreference: string;
  vehicles?: VehicleInfo[];
  vehicleCount?: number;
}

interface VehicleFuelProfile {
  vehicleLabel: string;
  mpg: number;
  tankGallons: number;
  isElectric: boolean;
  usableRangeMiles: number;
}

function isElectricVehicle(vehicle: VehicleInfo): boolean {
  return /electric|bev|battery/i.test(vehicle.fuelType ?? "");
}

function vehicleHaystack(vehicle: VehicleInfo): string {
  return `${vehicle.make} ${vehicle.model} ${vehicle.displayLabel}`.toLowerCase();
}

/** Estimated tank capacity (gallons) when EPA does not provide it. */
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

function buildVehicleProfiles(
  rentalKey: RentalPreferenceKey,
  vehicles: VehicleInfo[],
  vehicleCount: number
): VehicleFuelProfile[] {
  if (rentalKey === "movers" || drivenVehicleCount(rentalKey, vehicleCount, vehicles) === 0) {
    return [];
  }

  const drivers = drivingVehicles(rentalKey, vehicles);
  if (!drivers.length) {
    const mpg = mpgForRental(rentalKey, vehicles);
    const tank = estimateTankGallons(null, rentalKey);
    return [
      {
        vehicleLabel: rentalKey === "truck" ? "Rental truck" : "Your vehicle",
        mpg,
        tankGallons: tank,
        isElectric: false,
        usableRangeMiles: tank * mpg * (1 - FUEL_RESERVE_FRACTION),
      },
    ];
  }

  return drivers.map((vehicle) => {
    const mpg = mpgForDrivingVehicle(vehicle, rentalKey);
    if (isElectricVehicle(vehicle)) {
      const range = evRangeMiles(vehicle);
      return {
        vehicleLabel: vehicle.displayLabel,
        mpg,
        tankGallons: range / Math.max(mpg, 1),
        isElectric: true,
        usableRangeMiles: range * (1 - FUEL_RESERVE_FRACTION),
      };
    }
    const tank = estimateTankGallons(vehicle, rentalKey);
    return {
      vehicleLabel: vehicle.displayLabel,
      mpg,
      tankGallons: tank,
      isElectric: false,
      usableRangeMiles: tank * mpg * (1 - FUEL_RESERVE_FRACTION),
    };
  });
}

function fillsForLeg(profiles: VehicleFuelProfile[], legMiles: number): VehicleFuelFill[] {
  return profiles.map((profile) => {
    if (profile.isElectric) {
      const kwhToCharge =
        Math.round(legMiles * (KWH_PER_GALLON_GAS / Math.max(profile.mpg, 1)) * 10) / 10;
      return {
        vehicleLabel: profile.vehicleLabel,
        mpg: profile.mpg,
        tankGallons: profile.tankGallons,
        gallonsToFill: 0,
        kwhToCharge: kwhToCharge,
        isElectric: true,
      };
    }
    const consumed = legMiles / profile.mpg;
    const gallonsToFill = Math.min(
      profile.tankGallons * (1 - FUEL_RESERVE_FRACTION),
      Math.round(consumed * 10) / 10
    );
    return {
      vehicleLabel: profile.vehicleLabel,
      mpg: profile.mpg,
      tankGallons: profile.tankGallons,
      gallonsToFill,
      isElectric: false,
    };
  });
}

function summarizeMarker(profiles: VehicleFuelProfile[], fills: VehicleFuelFill[]): {
  mpg: number;
  tankGallons: number;
  gallonsNeeded: number;
  vehicleLabel: string;
  isElectric: boolean;
} {
  const limiting = profiles.reduce((min, p) =>
    p.usableRangeMiles < min.usableRangeMiles ? p : min
  );
  const gasFills = fills.filter((f) => !f.isElectric);
  const gallonsNeeded = gasFills.reduce((sum, f) => sum + f.gallonsToFill, 0);
  const allElectric = fills.every((f) => f.isElectric);

  return {
    mpg: limiting.mpg,
    tankGallons: limiting.tankGallons,
    gallonsNeeded: Math.round(gallonsNeeded * 10) / 10,
    isElectric: allElectric,
    vehicleLabel:
      profiles.length === 1
        ? profiles[0].vehicleLabel
        : `${profiles.length} vehicles`,
  };
}

/** Mile markers along the route where fuel/charging stops are needed. */
export function computeFuelStopMarkers(input: FuelStopPlannerInput): FuelStopMarker[] {
  const miles = Math.max(0, input.distanceMiles);
  if (miles < 80) return [];

  const rentalKey = parseRentalPreferenceKey(input.rentalPreference ?? "own");
  const vehicles = input.vehicles ?? [];
  const vehicleCount = input.vehicleCount ?? Math.max(1, vehicles.length);

  const profiles = buildVehicleProfiles(rentalKey, vehicles, vehicleCount);
  if (!profiles.length) return [];

  const milesPerLeg = Math.min(...profiles.map((p) => p.usableRangeMiles));
  if (milesPerLeg < 40) return [];

  const markers: FuelStopMarker[] = [];
  let mile = milesPerLeg;
  let prevMile = 0;

  while (mile < miles - MIN_MILES_BEFORE_DEST && markers.length < MAX_FUEL_STOPS) {
    const legMiles = mile - prevMile;
    const vehicleFills = fillsForLeg(profiles, legMiles);
    const summary = summarizeMarker(profiles, vehicleFills);

    markers.push({
      mile: Math.round(mile),
      legMiles: Math.round(legMiles),
      vehicleFills,
      ...summary,
    });

    prevMile = mile;
    mile += milesPerLeg;
  }

  return markers;
}

export function computeFuelStopMiles(input: FuelStopPlannerInput): number[] {
  return computeFuelStopMarkers(input).map((m) => m.mile);
}

function formatVehicleFillLine(fill: VehicleFuelFill, locale: "en" | "es"): string {
  if (fill.isElectric && fill.kwhToCharge != null) {
    return locale === "es"
      ? `${fill.vehicleLabel}: ~${fill.kwhToCharge} kWh`
      : `${fill.vehicleLabel}: ~${fill.kwhToCharge} kWh`;
  }
  return locale === "es"
    ? `${fill.vehicleLabel}: ${fill.gallonsToFill.toFixed(1)} gal (tanque ${fill.tankGallons.toFixed(0)} gal · ${fill.mpg} MPG)`
    : `${fill.vehicleLabel}: ${fill.gallonsToFill.toFixed(1)} gal (${fill.tankGallons.toFixed(0)} gal tank · ${fill.mpg} MPG)`;
}

export function formatFuelStopNote(
  marker: FuelStopMarker,
  mile: number,
  originLabel: string,
  locale: "en" | "es" = "en"
): string {
  const reservePct = Math.round(FUEL_RESERVE_FRACTION * 100);
  const perVehicle = marker.vehicleFills.map((f) => formatVehicleFillLine(f, locale)).join(" · ");

  if (marker.isElectric) {
    const header =
      locale === "es"
        ? `~${mile} mi · Recarga (${marker.legMiles} mi desde la última parada)`
        : `~${mile} mi · Charge stop (${marker.legMiles} mi since last stop)`;
    return `${header} · ${perVehicle}`;
  }

  const header =
    locale === "es"
      ? `~${mile} mi desde ${originLabel} · ${marker.legMiles} mi en este tramo · Repostar con ~${reservePct}% restante`
      : `~${mile} mi from ${originLabel} · ${marker.legMiles} mi leg · Refuel from ~${reservePct}% left`;

  return `${header} · ${perVehicle}`;
}

export function formatFuelStopPopupLines(
  marker: FuelStopMarker,
  locale: "en" | "es" = "en"
): string[] {
  return marker.vehicleFills.map((fill) => formatVehicleFillLine(fill, locale));
}
