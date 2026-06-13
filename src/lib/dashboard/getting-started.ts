import type { MoveProfile } from "@/lib/move-profile";
import type { ChecklistTask } from "@/lib/types";

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
}): GettingStartedStep[] {
  const { profile, isAddressConfirmed, tasks, boxesCount } = input;
  const hasRoute = Boolean(profile.origin?.trim() && profile.destination?.trim());
  const hasHousehold = Boolean(profile.household?.trim());
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return [
    {
      id: "route",
      labelKey: "gettingStarted.stepRoute",
      href: "/settings",
      done: hasRoute && hasHousehold,
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
      done: completedTasks >= 1,
    },
    {
      id: "plan",
      labelKey: "gettingStarted.stepPlan",
      href: "/moving-plan",
      done: hasRoute && completedTasks >= 3,
    },
    {
      id: "inventory",
      labelKey: "gettingStarted.stepInventory",
      href: "/inventory",
      done: boxesCount >= 1,
    },
  ];
}

export function gettingStartedProgress(steps: GettingStartedStep[]) {
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
    complete: done === total,
  };
}
