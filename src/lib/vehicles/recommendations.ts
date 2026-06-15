import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import type { VehicleInfo, VehicleTip } from "./types";

import {
  EV_KEYWORDS,
  SMALL_CAR_KEYWORDS,
  TOWING_SUV_KEYWORDS,
  TRUCK_KEYWORDS,
} from "./tow-keywords";

const KNOWN_SPECS: Record<string, { tow?: number; notesKey: string }> = {
  "volkswagen atlas": { tow: 5000, notesKey: "vehicleTips.atlasNotes" },
  "ford explorer": { tow: 5600, notesKey: "vehicleTips.explorerNotes" },
  "toyota highlander": { tow: 5000, notesKey: "vehicleTips.highlanderNotes" },
};

function includesKeyword(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function getKnownSpec(make: string, model: string) {
  const key = `${make} ${model}`.toLowerCase();
  return KNOWN_SPECS[key];
}

function tl(locale: Locale, key: string, params?: Record<string, string | number>) {
  return translate(locale, key, params);
}

export function getVehicleTips(vehicle: VehicleInfo, locale: Locale = "en"): VehicleTip[] {
  const tips: VehicleTip[] = [];
  const label = `${vehicle.make} ${vehicle.model}`;
  const yearNum = Number(vehicle.year);
  const age = new Date().getFullYear() - yearNum;
  const known = getKnownSpec(vehicle.make, vehicle.model);

  tips.push({
    id: "registered",
    type: "info",
    title: tl(locale, "vehicleTips.registeredTitle"),
    message: tl(locale, "vehicleTips.registeredMessage", { vehicle: vehicle.displayLabel }),
  });

  if (known) {
    tips.push({
      id: "known-spec",
      type: "success",
      title: known.tow
        ? tl(locale, "vehicleTips.towCapacityTitle", { lbs: known.tow.toLocaleString() })
        : tl(locale, "vehicleTips.goodFitTitle"),
      message: tl(locale, known.notesKey),
    });
  }

  if (includesKeyword(label, TOWING_SUV_KEYWORDS) || includesKeyword(label, TRUCK_KEYWORDS)) {
    tips.push({
      id: "tow-trailer",
      type: "success",
      title: tl(locale, "vehicleTips.towTrailerTitle"),
      message: tl(locale, "vehicleTips.towTrailerMessage"),
    });
  }

  if (includesKeyword(label, TRUCK_KEYWORDS)) {
    tips.push({
      id: "truck-bed",
      type: "info",
      title: tl(locale, "vehicleTips.truckBedTitle"),
      message: tl(locale, "vehicleTips.truckBedMessage"),
    });
  }

  if (includesKeyword(label, SMALL_CAR_KEYWORDS)) {
    tips.push({
      id: "small-car",
      type: "warning",
      title: tl(locale, "vehicleTips.smallCarTitle"),
      message: tl(locale, "vehicleTips.smallCarMessage"),
    });
    tips.push({
      id: "small-car-ship",
      type: "info",
      title: tl(locale, "vehicleTips.smallCarShipTitle"),
      message: tl(locale, "vehicleTips.smallCarShipMessage"),
    });
  }

  if (includesKeyword(label, EV_KEYWORDS)) {
    tips.push({
      id: "ev-route",
      type: "warning",
      title: tl(locale, "vehicleTips.evRouteTitle"),
      message: tl(locale, "vehicleTips.evRouteMessage"),
    });
    tips.push({
      id: "ev-tow",
      type: "warning",
      title: tl(locale, "vehicleTips.evTowTitle"),
      message: tl(locale, "vehicleTips.evTowMessage"),
    });
  }

  if (age >= 12) {
    tips.push({
      id: "older-vehicle",
      type: "warning",
      title: tl(locale, "vehicleTips.olderTitle"),
      message: tl(locale, "vehicleTips.olderMessage"),
    });
  }

  if (age <= 3) {
    tips.push({
      id: "new-vehicle",
      type: "info",
      title: tl(locale, "vehicleTips.newerTitle"),
      message: tl(locale, "vehicleTips.newerMessage"),
    });
  }

  tips.push({
    id: "registration",
    type: "info",
    title: tl(locale, "vehicleTips.registrationTitle"),
    message: tl(locale, "vehicleTips.registrationMessage"),
  });

  return tips;
}

export function getVehicleSummaryLine(vehicle: VehicleInfo, locale: Locale = "en"): string {
  const known = getKnownSpec(vehicle.make, vehicle.model);
  if (known?.tow) {
    return tl(locale, "vehicleTips.summaryTow", { lbs: known.tow.toLocaleString() });
  }
  if (includesKeyword(`${vehicle.make} ${vehicle.model}`, SMALL_CAR_KEYWORDS)) {
    return tl(locale, "vehicleTips.summaryCompact");
  }
  if (includesKeyword(`${vehicle.make} ${vehicle.model}`, EV_KEYWORDS)) {
    return tl(locale, "vehicleTips.summaryEv");
  }
  return tl(locale, "vehicleTips.summaryDefault");
}

export function getMultiVehicleSummary(vehicles: VehicleInfo[], locale: Locale = "en"): string {
  if (vehicles.length === 0) return tl(locale, "vehicleTips.multiNone");
  if (vehicles.length === 1) return getVehicleSummaryLine(vehicles[0], locale);
  const labels = vehicles.map((v) => v.displayLabel).join(" · ");
  return tl(locale, "vehicleTips.multiCount", { count: vehicles.length, labels });
}
