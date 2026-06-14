import type { MoveProfile } from "@/lib/move-profile";
import type { ChecklistTask, DocumentItem } from "@/lib/types";

export type JourneyPhase = "planning" | "preparing" | "final_week" | "move_week" | "settled";

export interface MoveBadge {
  id: string;
  labelKey: string;
  earned: boolean;
}

export interface MoveScoreResult {
  score: number;
  phase: JourneyPhase;
  badges: MoveBadge[];
}

export function resolveJourneyPhase(daysUntilMove: number): JourneyPhase {
  if (daysUntilMove < 0) return "settled";
  if (daysUntilMove <= 7) return "move_week";
  if (daysUntilMove <= 14) return "final_week";
  if (daysUntilMove <= 56) return "preparing";
  return "planning";
}

export function calculateMoveScore(input: {
  profile: MoveProfile;
  tasks: ChecklistTask[];
  documents: DocumentItem[];
  isAddressConfirmed: boolean;
  vehicleCount: number;
  hasRouteCoords: boolean;
}): MoveScoreResult {
  let score = 0;
  const { profile, tasks, documents, isAddressConfirmed, vehicleCount, hasRouteCoords } = input;

  if (profile.origin?.trim() && profile.destination?.trim()) score += 15;
  if (hasRouteCoords) score += 10;
  if (profile.household?.trim()) score += 5;
  if (profile.moveDate) score += 5;
  if (vehicleCount > 0) score += 5;
  if (isAddressConfirmed) score += 10;

  const completed = tasks.filter((t) => t.status === "completed").length;
  if (tasks.length > 0) {
    score += Math.round((completed / tasks.length) * 35);
  }

  const docsOk = documents.filter((d) => d.status !== "missing").length;
  if (documents.length > 0) {
    score += Math.round((docsOk / documents.length) * 15);
  }

  score = Math.min(100, Math.max(0, score));

  const taskPct = tasks.length ? completed / tasks.length : 0;
  const badges: MoveBadge[] = [
    { id: "route", labelKey: "gamification.badgeRoute", earned: hasRouteCoords },
    { id: "address", labelKey: "gamification.badgeAddress", earned: isAddressConfirmed },
    { id: "vehicle", labelKey: "gamification.badgeVehicle", earned: vehicleCount > 0 },
    { id: "checklist", labelKey: "gamification.badgeChecklist", earned: taskPct >= 0.5 },
    { id: "budget", labelKey: "gamification.badgeBudget", earned: profile.budget > 0 },
    { id: "pet", labelKey: "gamification.badgePet", earned: profile.pets },
  ];

  const daysUntil = profile.moveDate
    ? Math.ceil(
        (new Date(profile.moveDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 999;

  return {
    score,
    phase: resolveJourneyPhase(daysUntil),
    badges,
  };
}
