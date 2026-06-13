"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { useChecklist } from "@/contexts/checklist-context";
import { useInventory } from "@/contexts/inventory-context";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import {
  buildGettingStartedSteps,
  gettingStartedProgress,
} from "@/lib/dashboard/getting-started";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function GettingStartedCard() {
  const t = useT();
  const { profile, isAddressConfirmed } = useMove();
  const { tasks } = useChecklist();
  const { boxes } = useInventory();

  const steps = useMemo(
    () =>
      buildGettingStartedSteps({
        profile,
        isAddressConfirmed,
        tasks,
        boxesCount: boxes.length,
      }),
    [profile, isAddressConfirmed, tasks, boxes.length]
  );

  const progress = useMemo(() => gettingStartedProgress(steps), [steps]);

  if (progress.complete) return null;

  const nextStep = steps.find((s) => !s.done);

  return (
    <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("gettingStarted.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("gettingStarted.subtitle")}</p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("gettingStarted.progress")}</span>
            <span>{t("gettingStarted.progressCount", { done: progress.done, total: progress.total })}</span>
          </div>
          <Progress value={progress.percent} className="h-2" />
        </div>

        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50",
                  step.done && "border-primary/20 bg-primary/5"
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={cn("flex-1", step.done && "text-muted-foreground line-through")}>
                  {t(step.labelKey)}
                </span>
                {!step.done && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              </Link>
            </li>
          ))}
        </ul>

        {nextStep && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={nextStep.href}>
              {t("gettingStarted.nextAction")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
