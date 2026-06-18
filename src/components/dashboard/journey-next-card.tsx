"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useChecklist } from "@/contexts/checklist-context";
import { useInventory } from "@/contexts/inventory-context";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { useUtilityPicks } from "@/hooks/use-utility-picks";
import { pickNextJourneyAction } from "@/lib/dashboard/journey-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function JourneyNextCard() {
  const t = useT();
  const { profile, isAddressConfirmed, truckChoice } = useMove();
  const { tasks } = useChecklist();
  const { boxes } = useInventory();
  const { count: utilityPickCount } = useUtilityPicks();

  const hasRouteCoords =
    profile.originLat != null &&
    profile.originLon != null &&
    profile.destinationLat != null &&
    profile.destinationLon != null;

  const action = useMemo(
    () =>
      pickNextJourneyAction({
        profile,
        isAddressConfirmed,
        tasks,
        boxesCount: boxes.length,
        truckChoice,
        hasRouteCoords,
        utilityPickCount,
      }),
    [profile, isAddressConfirmed, tasks, boxes.length, truckChoice, hasRouteCoords, utilityPickCount]
  );

  if (!action) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("journey.nextActionTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t(action.descriptionKey, action.params)}
        </p>
        <Button asChild className="w-full sm:w-auto">
          <Link href={action.href}>
            {t(action.labelKey)}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
