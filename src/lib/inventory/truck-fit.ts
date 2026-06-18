import { totalEstimatedWeightLbs } from "@/lib/inventory/load-order";
import type { InventoryBox } from "@/lib/inventory/types";

export type TruckFitLevel = "light" | "trailer_ok" | "truck_recommended" | "truck_required" | "unknown";

export interface TruckFitAssessment {
  level: TruckFitLevel;
  boxCount: number;
  weightLbs: number;
  messageKey: string;
}

export function assessTruckFit(boxCount: number, weightLbs = 0): TruckFitAssessment {
  if (boxCount === 0 && weightLbs === 0) {
    return { level: "unknown", boxCount: 0, weightLbs: 0, messageKey: "truckFit.unknown" };
  }

  if (boxCount >= 35 || weightLbs >= 3500) {
    return {
      level: "truck_required",
      boxCount,
      weightLbs,
      messageKey: "truckFit.truckRequired",
    };
  }

  if (boxCount >= 20 || weightLbs >= 2000) {
    return {
      level: "truck_recommended",
      boxCount,
      weightLbs,
      messageKey: "truckFit.truckRecommended",
    };
  }

  if (boxCount >= 8 || weightLbs >= 800) {
    return {
      level: "trailer_ok",
      boxCount,
      weightLbs,
      messageKey: "truckFit.trailerOk",
    };
  }

  return {
    level: "light",
    boxCount,
    weightLbs,
    messageKey: "truckFit.light",
  };
}

export function assessTruckFitFromBoxes(boxes: InventoryBox[]): TruckFitAssessment {
  const boxCount = boxes.length;
  const weightLbs = totalEstimatedWeightLbs(boxes);
  return assessTruckFit(boxCount, weightLbs);
}
