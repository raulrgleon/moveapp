import type { MoveProfile } from "@/lib/move-profile";
import type { ChecklistTask } from "@/lib/types";

export interface JourneyStep {
  id: string;
  labelKey: string;
  href: string;
  done: boolean;
}

export interface JourneyNextAction {
  id: string;
  labelKey: string;
  href: string;
  descriptionKey: string;
  params?: Record<string, string | number>;
}

export function buildJourneySteps(input: {
  profile: MoveProfile;
  isAddressConfirmed: boolean;
  tasks: ChecklistTask[];
  boxesCount: number;
  truckChoice: string | null;
  hasRouteCoords: boolean;
  utilityPickCount: number;
}): JourneyStep[] {
  const { profile, isAddressConfirmed, tasks, boxesCount, truckChoice, hasRouteCoords, utilityPickCount } =
    input;
  const hasRoute = Boolean(profile.origin?.trim() && profile.destination?.trim());
  const hasHousehold = Boolean(profile.household?.trim());
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return [
    {
      id: "route",
      labelKey: "gettingStarted.stepRouteMap",
      href: "/route",
      done: hasRoute && hasHousehold && hasRouteCoords,
    },
    {
      id: "budget",
      labelKey: "gettingStarted.stepBudget",
      href: "/budget",
      done: hasRoute && completedTasks >= 1,
    },
    {
      id: "truck",
      labelKey: "gettingStarted.stepTruck",
      href: "/trucks",
      done: Boolean(truckChoice?.trim()),
    },
    {
      id: "address",
      labelKey: "gettingStarted.stepAddress",
      href: "/utilities",
      done: isAddressConfirmed,
    },
    {
      id: "checklist",
      labelKey: "gettingStarted.stepChecklist",
      href: "/checklist",
      done: completedTasks >= 3,
    },
    {
      id: "inventory",
      labelKey: "gettingStarted.stepInventory",
      href: "/inventory",
      done: boxesCount >= 1,
    },
    {
      id: "plan",
      labelKey: "gettingStarted.stepPlan",
      href: "/moving-plan",
      done: hasRoute && completedTasks >= 5,
    },
  ];
}

export function journeyProgress(steps: JourneyStep[]) {
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
    complete: done === total,
  };
}

export function pickNextJourneyAction(input: {
  profile: MoveProfile;
  isAddressConfirmed: boolean;
  tasks: ChecklistTask[];
  boxesCount: number;
  truckChoice: string | null;
  hasRouteCoords: boolean;
  utilityPickCount: number;
}): JourneyNextAction | null {
  const steps = buildJourneySteps(input);
  const next = steps.find((s) => !s.done);
  if (!next) return null;

  const descriptions: Record<string, string> = {
    route: "journey.nextRouteDesc",
    budget: "journey.nextBudgetDesc",
    truck: "journey.nextTruckDesc",
    address: "journey.nextAddressDesc",
    checklist: "journey.nextChecklistDesc",
    inventory: "journey.nextInventoryDesc",
    plan: "journey.nextPlanDesc",
  };

  return {
    id: next.id,
    labelKey: next.labelKey,
    href: next.href,
    descriptionKey: descriptions[next.id] ?? "journey.nextDefaultDesc",
    params: {
      destination: input.profile.destination.split(",")[0]?.trim() ?? input.profile.destination,
    },
  };
}
