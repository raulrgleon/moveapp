"use client";

import type { JourneyPhase } from "@/lib/gamification/move-score";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import { ClipboardList, Home, Package, Truck } from "lucide-react";

const PHASES: { id: JourneyPhase; icon: typeof Home; labelKey: string }[] = [
  { id: "planning", icon: ClipboardList, labelKey: "gamification.phasePlanning" },
  { id: "preparing", icon: Package, labelKey: "gamification.phasePreparing" },
  { id: "final_week", icon: Truck, labelKey: "gamification.phaseFinalWeek" },
  { id: "move_week", icon: Truck, labelKey: "gamification.phaseMoveWeek" },
  { id: "settled", icon: Home, labelKey: "gamification.phaseSettled" },
];

const ORDER: JourneyPhase[] = ["planning", "preparing", "final_week", "move_week", "settled"];

interface JourneyPhaseBarProps {
  current: JourneyPhase;
  className?: string;
}

export function JourneyPhaseBar({ current, className }: JourneyPhaseBarProps) {
  const t = useT();
  const idx = ORDER.indexOf(current);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-1">
        {PHASES.map((phase, i) => {
          const Icon = phase.icon;
          const active = i <= idx;
          const isCurrent = phase.id === current;
          return (
            <div key={phase.id} className="flex flex-1 flex-col items-center gap-1 min-w-0">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500",
                  active
                    ? "border-primary bg-primary/15 text-primary scale-100"
                    : "border-muted bg-muted/50 text-muted-foreground scale-90",
                  isCurrent && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background scale-110 shadow-lg shadow-primary/20"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium text-center leading-tight hidden sm:block truncate max-w-full px-0.5",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t(phase.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full brand-cta-gradient transition-all duration-700 ease-out"
          style={{ width: `${Math.max(8, ((idx + 1) / ORDER.length) * 100)}%` }}
        />
      </div>
    </div>
  );
}
