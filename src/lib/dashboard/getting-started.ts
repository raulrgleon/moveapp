import type { MoveProfile } from "@/lib/move-profile";
import type { ChecklistTask } from "@/lib/types";
import { buildJourneySteps, journeyProgress } from "@/lib/dashboard/journey-steps";

export interface GettingStartedStep {
  id: string;
  labelKey: string;
  href: string;
  done: boolean;
}

export function buildGettingStartedSteps(input: {
  profile: MoveProfile;
  isAddressConfirmed: boolean;
  tasks: ChecklistTask[];
  boxesCount: number;
  truckChoice?: string | null;
  hasRouteCoords?: boolean;
  utilityPickCount?: number;
}): GettingStartedStep[] {
  return buildJourneySteps({
    profile: input.profile,
    isAddressConfirmed: input.isAddressConfirmed,
    tasks: input.tasks,
    boxesCount: input.boxesCount,
    truckChoice: input.truckChoice ?? null,
    hasRouteCoords: input.hasRouteCoords ?? Boolean(
      input.profile.origin?.trim() &&
        input.profile.destination?.trim()
    ),
    utilityPickCount: input.utilityPickCount ?? (input.isAddressConfirmed ? 1 : 0),
  });
}

export function gettingStartedProgress(steps: GettingStartedStep[]) {
  return journeyProgress(steps);
}
