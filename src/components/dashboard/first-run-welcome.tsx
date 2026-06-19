"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useChecklist } from "@/contexts/checklist-context";
import { useInventory } from "@/contexts/inventory-context";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { useUtilityPicks } from "@/hooks/use-utility-picks";
import { TRIAL_DAYS } from "@/lib/billing/plan";
import { pickNextJourneyAction } from "@/lib/dashboard/journey-steps";
import { hasRouteCoordinates } from "@/lib/move/profile-completeness";
import { openPilotChat } from "@/lib/pilot/pilot-ui-bridge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function welcomeKey(userId: string) {
  return `movepilot_welcome_v1_${userId}`;
}

export function FirstRunWelcome() {
  const t = useT();
  const { user, isHydrated, isAdmin } = useAuth();
  const { profile, isAddressConfirmed, truckChoice } = useMove();
  const { tasks } = useChecklist();
  const { boxes } = useInventory();
  const { count: utilityPickCount } = useUtilityPicks();
  const [open, setOpen] = useState(false);

  const nextAction = useMemo(
    () =>
      pickNextJourneyAction({
        profile,
        isAddressConfirmed,
        tasks,
        boxesCount: boxes.length,
        truckChoice,
        hasRouteCoords: hasRouteCoordinates(profile),
        utilityPickCount,
      }),
    [profile, isAddressConfirmed, tasks, boxes.length, truckChoice, utilityPickCount]
  );

  useEffect(() => {
    if (!isHydrated || !user?.id || isAdmin) return;
    if (localStorage.getItem(welcomeKey(user.id))) return;
    setOpen(true);
  }, [isHydrated, user?.id, isAdmin]);

  const dismiss = () => {
    if (user?.id) localStorage.setItem(welcomeKey(user.id), String(Date.now()));
    setOpen(false);
  };

  const handleAskPilot = () => {
    dismiss();
    openPilotChat();
  };

  if (!user?.id || isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("welcome.title")}
          </DialogTitle>
          <DialogDescription className="text-left pt-1">
            {t("welcome.desc", { days: TRIAL_DAYS })}
          </DialogDescription>
        </DialogHeader>

        <ul className="text-sm text-muted-foreground space-y-1.5 pl-1">
          <li>• {t("upgrade.perk2")}</li>
          <li>• {t("upgrade.perk1")}</li>
          <li>• {t("upgrade.perk4")}</li>
        </ul>

        <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
          {nextAction && (
            <Button className="w-full" asChild onClick={dismiss}>
              <Link href={nextAction.href}>
                {t("welcome.startCta")}: {t(nextAction.labelKey)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={handleAskPilot}>
            {t("welcome.askPilot")}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={dismiss}>
            {t("welcome.explore")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
