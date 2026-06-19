"use client";

import { useEffect, useState } from "react";
import { Bot, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { openPilotChat } from "@/lib/pilot/pilot-ui-bridge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function pilotIntroKey(userId: string) {
  return `movepilot_pilot_intro_v1_${userId}`;
}

function welcomeSeenKey(userId: string) {
  return `movepilot_welcome_v1_${userId}`;
}

export function PilotIntroChip() {
  const t = useT();
  const { user, isHydrated, isAdmin } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const userId = user?.id;
    if (!isHydrated || !userId || isAdmin) return;
    if (localStorage.getItem(pilotIntroKey(userId))) return;

    const showChip = () => setVisible(true);

    if (localStorage.getItem(welcomeSeenKey(userId))) {
      const timer = window.setTimeout(showChip, 1200);
      return () => window.clearTimeout(timer);
    }

    const poll = window.setInterval(() => {
      if (localStorage.getItem(welcomeSeenKey(userId))) {
        window.clearInterval(poll);
        showChip();
      }
    }, 400);

    return () => window.clearInterval(poll);
  }, [isHydrated, user?.id, isAdmin]);

  const dismiss = () => {
    if (user?.id) localStorage.setItem(pilotIntroKey(user.id), "1");
    setVisible(false);
  };

  const handleOpen = () => {
    openPilotChat();
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed z-[45] left-3 right-3 sm:left-auto sm:right-24 sm:max-w-xs",
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] xl:hidden",
        "animate-fade-in"
      )}
    >
      <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-card/95 backdrop-blur shadow-lg p-3">
        <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{t("pilotIntro.chip")}</p>
          <Button size="sm" className="mt-2 h-8" onClick={handleOpen}>
            {t("welcome.askPilot")}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={dismiss}
          aria-label={t("pilotIntro.dismiss")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
