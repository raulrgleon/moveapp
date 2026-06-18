import type { RentalPreferenceKey } from "@/lib/move-profile";
import type { RouteStop } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";
import {
  effectiveFuelMiles,
  mpgForVehicle,
} from "@/lib/vehicles/fuel-economy";
import { averageGasPriceAlongRoute, fetchLiveElectricPricePerKwh } from "@/lib/budget/gas-prices";

export const FUEL_MILES_ADJUSTMENT = 4;
const KWH_PER_GALLON_GAS = 33.7;

export interface FuelCostInput {
  distanceMiles: number;
  rentalKey: RentalPreferenceKey;
  vehicleCount: number;
  origin: string;
  destination: string;
  routeStops?: RouteStop[];
  vehicles?: VehicleInfo[];
  locale?: "en" | "es";
}

export interface VehicleFuelLine {
  vehicleLabel: string;
  mpg: number;
  gallons: number;
  kwh: number;
  isElectric: boolean;
}

export function isElectricVehicle(vehicle: VehicleInfo): boolean {
  return /electric|bev|battery/i.test(vehicle.fuelType ?? "");
}

/** Vehicles that burn fuel on the trip (excludes shipped units). */
export function drivingVehiclesForFuel(
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
  const configured = vehicles.filter(
    (v) => v.make?.trim() && v.model?.trim() && !v.needsTransport
  );
  if (configured.length) return configured;
  return vehicles.filter((v) => v.make?.trim() && v.model?.trim());
}

/** MPG for one vehicle on this trip (tow vehicle pays trailer penalty). */
export function mpgOnTrip(
  vehicle: VehicleInfo,
  rentalKey: RentalPreferenceKey,
  index = 0
): number {
  if (rentalKey === "truck") return 10;
  if (rentalKey === "trailer" || rentalKey === "combo") {
    if (index === 0) return Math.round(mpgForVehicle(vehicle) * 0.72 * 10) / 10;
    return mpgForVehicle(vehicle);
  }
  return mpgForVehicle(vehicle);
}

function fallbackMpg(rentalKey: RentalPreferenceKey): number {
  switch (rentalKey) {
    case "truck":
      return 10;
    case "trailer":
    case "combo":
      return 14;
    case "movers":
      return 28;
    default:
      return 26;
  }
}

/** Per-vehicle gallons / kWh for the full route distance. */
export function computeVehicleFuelLines(
  fuelMiles: number,
  rentalKey: RentalPreferenceKey,
  vehicles: VehicleInfo[],
  vehicleCount: number
): VehicleFuelLine[] {
  const drivers = drivingVehiclesForFuel(rentalKey, vehicles);
  if (!drivers.length) return [];

  return drivers.map((vehicle, index) => {
    const mpg = mpgOnTrip(vehicle, rentalKey, index);
    if (isElectricVehicle(vehicle)) {
      const kwh =
        Math.round(fuelMiles * (KWH_PER_GALLON_GAS / Math.max(mpg, 1)) * 10) / 10;
      return {
        vehicleLabel: vehicle.displayLabel,
        mpg,
        gallons: 0,
        kwh,
        isElectric: true,
      };
    }
    const gallons = Math.round((fuelMiles / Math.max(mpg, 1)) * 10) / 10;
    return {
      vehicleLabel: vehicle.displayLabel,
      mpg,
      gallons,
      kwh: 0,
      isElectric: false,
    };
  });
}

function genericFuelLines(
  fuelMiles: number,
  rentalKey: RentalPreferenceKey,
  vehicleCount: number
): VehicleFuelLine[] {
  const count = Math.max(1, vehicleCount);
  const mpg = fallbackMpg(rentalKey);
  return Array.from({ length: count }, (_, index) => ({
    vehicleLabel:
      count === 1
        ? rentalKey === "truck"
          ? "Rental truck"
          : "Your vehicle"
        : `Vehicle ${index + 1}`,
    mpg,
    gallons: Math.round((fuelMiles / mpg) * 10) / 10,
    kwh: 0,
    isElectric: false,
  }));
}

export function mpgForRental(rentalKey: RentalPreferenceKey, vehicles: VehicleInfo[]): number {
  const fuelMiles = 1000;
  const lines = computeVehicleFuelLines(fuelMiles, rentalKey, vehicles, vehicles.length || 1);
  if (!lines.length) return fallbackMpg(rentalKey);

  const gasLines = lines.filter((line) => !line.isElectric && line.gallons > 0);
  if (gasLines.length) {
    const totalGallons = gasLines.reduce((sum, line) => sum + line.gallons, 0);
    return Math.round((fuelMiles / totalGallons) * 10) / 10;
  }

  return Math.round(lines.reduce((sum, line) => sum + line.mpg, 0) / lines.length);
}

export function drivenVehicleCount(
  rentalKey: RentalPreferenceKey,
  vehicleCount: number,
  vehicles: VehicleInfo[]
): number {
  const drivers = drivingVehiclesForFuel(rentalKey, vehicles);
  if (drivers.length) return drivers.length;
  if (rentalKey === "movers") return 0;
  return Math.max(1, vehicleCount);
}

function formatFuelLineNote(
  line: VehicleFuelLine,
  pricePerGallon: number,
  pricePerKwh: number,
  locale: "en" | "es"
): string {
  if (line.isElectric) {
    return locale === "es"
      ? `${line.vehicleLabel}: ~${line.kwh} kWh @ $${pricePerKwh.toFixed(2)}/kWh`
      : `${line.vehicleLabel}: ~${line.kwh} kWh @ $${pricePerKwh.toFixed(2)}/kWh`;
  }
  return locale === "es"
    ? `${line.vehicleLabel}: ~${line.gallons} gal @ ${line.mpg} MPG`
    : `${line.vehicleLabel}: ~${line.gallons} gal @ ${line.mpg} MPG`;
}

function resolveFuelLines(
  fuelMiles: number,
  rentalKey: RentalPreferenceKey,
  vehicles: VehicleInfo[],
  vehicleCount: number
): VehicleFuelLine[] {
  const lines = computeVehicleFuelLines(fuelMiles, rentalKey, vehicles, vehicleCount);
  if (lines.length) return lines;
  if (rentalKey === "movers") return [];
  return genericFuelLines(fuelMiles, rentalKey, vehicleCount);
}

export async function estimateFuelCost(input: FuelCostInput): Promise<{
  total: number;
  pricePerGallon: number;
  gallons: number;
  mpg: number;
  fuelMiles: number;
  note: string;
  isElectric: boolean;
  vehicleLines: VehicleFuelLine[];
}> {
  const vehicles = (input.vehicles ?? []).filter((v) => v.make?.trim() && v.model?.trim());
  const fuelMiles = effectiveFuelMiles(input.distanceMiles);
  const locale = input.locale ?? "en";
  const lines = resolveFuelLines(fuelMiles, input.rentalKey, vehicles, input.vehicleCount);

  if (!lines.length) {
    return {
      total: 0,
      pricePerGallon: 0,
      gallons: 0,
      mpg: 0,
      fuelMiles,
      note: locale === "es" ? "Sin combustible (solo mudadores)." : "No fuel (movers only).",
      isElectric: false,
      vehicleLines: [],
    };
  }

  const hasGas = lines.some((line) => !line.isElectric && line.gallons > 0);
  const hasEv = lines.some((line) => line.isElectric && line.kwh > 0);

  const pricePerGallon = hasGas
    ? await averageGasPriceAlongRoute(
        input.origin,
        input.destination,
        input.routeStops ?? []
      )
    : 0;
  const pricePerKwh = hasEv ? await fetchLiveElectricPricePerKwh() : 0;

  let total = 0;
  for (const line of lines) {
    if (line.isElectric) {
      total += line.kwh * pricePerKwh;
    } else {
      total += line.gallons * pricePerGallon;
    }
  }

  const totalGallons = Math.round(lines.reduce((sum, line) => sum + line.gallons, 0) * 10) / 10;
  const totalKwh = Math.round(lines.reduce((sum, line) => sum + line.kwh, 0));
  const gasLines = lines.filter((line) => !line.isElectric);
  const mpg =
    gasLines.length && totalGallons > 0
      ? Math.round((fuelMiles * gasLines.length) / totalGallons)
      : lines[0]?.mpg ?? fallbackMpg(input.rentalKey);

  const perVehicle = lines
    .map((line) => formatFuelLineNote(line, pricePerGallon, pricePerKwh, locale))
    .join(" · ");

  const note =
    locale === "es"
      ? `~${totalGallons > 0 ? `${totalGallons} gal` : `${totalKwh} kWh`} total (${fuelMiles} mi efectivas) · ${perVehicle}`
      : `~${totalGallons > 0 ? `${totalGallons} gal` : `${totalKwh} kWh`} total (${fuelMiles} effective mi) · ${perVehicle}`;

  return {
    total: Math.round(total),
    pricePerGallon: hasGas ? pricePerGallon : pricePerKwh,
    gallons: totalGallons,
    mpg,
    fuelMiles,
    note,
    isElectric: lines.every((line) => line.isElectric),
    vehicleLines: lines,
  };
}

/** Sync wrapper for client-side estimates without route stop gas prices. */
export function estimateFuelCostSync(
  input: Omit<FuelCostInput, "routeStops"> & { pricePerGallon?: number; pricePerKwh?: number }
): {
  total: number;
  pricePerGallon: number;
  gallons: number;
  mpg: number;
  fuelMiles: number;
  note: string;
  vehicleLines: VehicleFuelLine[];
} {
  const vehicles = (input.vehicles ?? []).filter((v) => v.make?.trim() && v.model?.trim());
  const fuelMiles = effectiveFuelMiles(input.distanceMiles);
  const pricePerGallon = input.pricePerGallon ?? 3.45;
  const pricePerKwh = input.pricePerKwh ?? 0.16;
  const lines = resolveFuelLines(fuelMiles, input.rentalKey, vehicles, input.vehicleCount);

  let total = 0;
  for (const line of lines) {
    total += line.isElectric ? line.kwh * pricePerKwh : line.gallons * pricePerGallon;
  }

  const totalGallons = Math.round(lines.reduce((sum, line) => sum + line.gallons, 0) * 10) / 10;
  const gasLines = lines.filter((line) => !line.isElectric);
  const mpg =
    gasLines.length && totalGallons > 0
      ? Math.round((fuelMiles * gasLines.length) / totalGallons)
      : mpgForRental(input.rentalKey, vehicles);

  const perVehicle = lines
    .map((line) => formatFuelLineNote(line, pricePerGallon, pricePerKwh, "en"))
    .join(" · ");

  return {
    total: Math.round(total),
    pricePerGallon,
    gallons: totalGallons,
    mpg,
    fuelMiles,
    note: perVehicle
      ? `~${totalGallons} gal total (${fuelMiles} mi) · ${perVehicle}`
      : `~${Math.round(total)} total (${fuelMiles} mi).`,
    vehicleLines: lines,
  };
}
