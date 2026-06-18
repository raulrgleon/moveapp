import type { MoveProfile } from "@/lib/move-profile";
import type { TruckOption } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { anyVehicleCanTow } from "@/lib/vehicles/tow-capacity";
import { parseRentalPreferenceKey } from "@/lib/move-profile";
import { estimateTruckOptions } from "@/lib/trucks/recommendations";
import type { Locale } from "@/lib/i18n";
import type { TruckFitAssessment } from "@/lib/inventory/truck-fit";
import { assessTruckFit } from "@/lib/inventory/truck-fit";

export function pickSmartTruckOption(
  profile: MoveProfile,
  distanceMiles: number,
  vehicles: VehicleInfo[],
  locale: Locale,
  fit?: TruckFitAssessment
): TruckOption | null {
  const options = estimateTruckOptions(profile, distanceMiles, locale, vehicles);
  if (options.length === 0) return null;

  const rentalKey = parseRentalPreferenceKey(profile.rentalPreference);
  const canTow = anyVehicleCanTow(vehicles);
  const assessment = fit ?? { level: "unknown" as const, boxCount: 0, weightLbs: 0, messageKey: "" };

  if (rentalKey === "own" && distanceMiles < 400 && canTow) {
    return null;
  }

  if (assessment.level === "truck_required") {
    const trucks = options.filter((o) => o.type === "truck");
    return trucks.sort((a, b) => a.estimatedPrice - b.estimatedPrice)[0] ?? options[0];
  }

  if (canTow && distanceMiles < 1200) {
    const trailers = options.filter((o) => o.type === "trailer");
    if (trailers.length) {
      return trailers.sort((a, b) => a.estimatedPrice - b.estimatedPrice)[0];
    }
  }

  if (distanceMiles >= 1200 || /4|5|6|large|grande/i.test(profile.household)) {
    const trucks = options.filter((o) => o.type === "truck");
    return trucks.sort((a, b) => a.estimatedPrice - b.estimatedPrice)[0] ?? options[0];
  }

  return options.reduce((best, o) => (o.estimatedPrice < best.estimatedPrice ? o : best));
}

export function smartDefaultTab(vehicles: VehicleInfo[], boxCount: number): "trailers" | "trucks" {
  const fit = assessTruckFit(boxCount, 0);
  if (fit.level === "truck_required") return "trucks";
  if (anyVehicleCanTow(vehicles)) return "trailers";
  return "trucks";
}
