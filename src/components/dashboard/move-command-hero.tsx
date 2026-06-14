"use client";

import Link from "next/link";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import { RouteLineAnimation } from "@/components/dashboard/route-line-animation";
import { JourneyPhaseBar } from "@/components/dashboard/journey-phase-bar";
import { MoveScoreRing } from "@/components/dashboard/move-score-ring";
import { CountUp } from "@/components/ui/count-up";
import { Button } from "@/components/ui/button";
import type { MoveScoreResult } from "@/lib/gamification/move-score";
import { useT } from "@/contexts/locale-context";
import { useLocale } from "@/contexts/locale-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MoveCommandHeroProps {
  origin: string;
  destination: string;
  moveDate: string;
  daysLeft: number;
  distanceMiles?: number;
  driveTimeLabel?: string;
  gamification: MoveScoreResult;
  className?: string;
}

export function MoveCommandHero({
  origin,
  destination,
  moveDate,
  daysLeft,
  distanceMiles,
  driveTimeLabel,
  gamification,
  className,
}: MoveCommandHeroProps) {
  const t = useT();
  const { locale } = useLocale();
  const emotional =
    daysLeft >= 0
      ? t("gamification.countdownEmotional", { days: daysLeft })
      : t("gamification.welcomeHome");

  return (
    <div
      className={cn(
        "glass-card brand-card-shine relative overflow-hidden rounded-2xl border border-primary/25 p-6 sm:p-8",
        "bg-gradient-to-br from-primary/10 via-card to-brand-accent/5",
        "shadow-xl shadow-primary/10 dark:shadow-primary/5",
        className
      )}
    >
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none" />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="space-y-4 min-w-0">
          <div className="brand-pill w-fit animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            {t(`gamification.phaseLabel.${gamification.phase}`)}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{t("dashboardPage.movingRoute")}</p>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight break-words mt-1">
              {origin}{" "}
              <span className="text-primary mx-1" aria-hidden>
                →
              </span>{" "}
              {destination}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{emotional}</p>
          </div>

          <RouteLineAnimation />

          <div className="flex flex-wrap gap-4 text-sm">
            {distanceMiles != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 border px-3 py-1 font-medium">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <CountUp value={distanceMiles} suffix=" mi" />
              </span>
            )}
            {driveTimeLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 border px-3 py-1 font-medium">
                {driveTimeLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 border px-3 py-1 font-medium">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {formatDate(moveDate, locale)}
            </span>
          </div>

          <JourneyPhaseBar current={gamification.phase} />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/route">{t("dashboardPage.viewRouteMap")}</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">{t("settings.updateMove")}</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 lg:pt-2">
          <MoveScoreRing score={gamification.score} size={112} />
          <div className="text-center rounded-xl brand-cta-gradient px-5 py-3 text-primary-foreground shadow-lg min-w-[120px]">
            <p className="text-xs opacity-90">{t("dashboardPage.countdown")}</p>
            <p className="text-3xl font-bold tabular-nums">
              {daysLeft >= 0 ? (
                <CountUp value={daysLeft} />
              ) : (
                "0"
              )}
            </p>
            <p className="text-xs opacity-90">{t("dashboardPage.daysShort")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
