"use client";

import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  MapPin,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

/** Single premium command panel — hero visual */
export function LandingPremiumPanel() {
  const t = useT();
  const score = 87;

  return (
    <div className="relative w-full">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-brand-accent/15 blur-2xl sm:-inset-6" />
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_24px_64px_-16px_hsl(var(--primary)/0.3)] ring-1 ring-black/[0.04]">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("landing.mockup.panelTitle")}
          </span>
        </div>

        <div className="bg-gradient-to-b from-background to-muted/20 p-5 sm:p-6">
          {/* Readiness hero inside panel */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {t("landing.readiness.eyebrow")}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {score}%
                </span>
                <span className="text-sm text-muted-foreground">{t("landing.mockup.ready")}</span>
              </div>
            </div>
            <div className="relative h-20 w-20 shrink-0">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/60" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 * (1 - score / 100)}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
            </div>
          </div>

          {/* Unified strip: budget + route + next task */}
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-border/50 bg-background/80 p-3 backdrop-blur">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("landing.mockup.budget")}
              </p>
              <p className="mt-0.5 text-sm font-bold">$4,250</p>
              <p className="text-[10px] text-emerald-600">{t("landing.mockup.onTrack")}</p>
            </div>
            <div className="border-x border-border/50 px-2">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("landing.mockup.route")}
              </p>
              <p className="mt-0.5 text-sm font-bold">14h</p>
              <p className="truncate text-[10px] text-muted-foreground">Austin → Denver</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("landing.mockup.nextUp")}
              </p>
              <p className="mt-0.5 text-xs font-semibold leading-tight">
                {t("landing.mockup.nextTask")}
              </p>
            </div>
          </div>

          {/* Mini route + checklist row */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-background/60 p-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {t("landing.mockup.routePreview")}
              </div>
              <div className="mt-2 h-12 rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-brand-accent/20 relative overflow-hidden">
                <div className="absolute inset-y-0 left-[15%] h-2 w-2 top-1/2 -translate-y-1/2 rounded-full bg-primary shadow-sm" />
                <div className="absolute inset-y-0 left-[50%] h-1.5 w-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary/60" />
                <div className="absolute inset-y-0 right-[12%] h-2 w-2 top-1/2 -translate-y-1/2 rounded-full bg-brand-accent" />
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("landing.mockup.checklist")}
              </p>
              <ul className="mt-2 space-y-1">
                {[t("landing.mockup.taskDone"), t("landing.mockup.taskPending")].map((task, i) => (
                  <li key={task} className="flex items-center gap-2 text-[11px]">
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 items-center justify-center rounded-full",
                        i === 0 ? "bg-primary text-primary-foreground" : "border border-border"
                      )}
                    >
                      {i === 0 ? <Check className="h-2 w-2" /> : null}
                    </span>
                    <span className={i === 0 ? "text-muted-foreground line-through" : "font-medium"}>
                      {task}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI recommendation — single line, not a module */}
          <div className="mt-3 flex gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                Pilot
              </p>
              <p className="mt-1 text-sm leading-snug text-foreground/90">{t("landing.mockup.pilotHint")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full-width WOW readiness score */
export function LandingWowReadiness() {
  const t = useT();
  const score = 87;

  const warnings = ["warning1", "warning2", "warning3"] as const;
  const successes = ["success1", "success2"] as const;

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/15 via-amber-500/5 to-emerald-500/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-4 sm:px-10 sm:py-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            {t("landing.readiness.eyebrow")}
          </p>
        </div>
        <div className="px-6 py-8 sm:px-10 sm:py-12">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <div>
              <p className="font-display text-7xl font-extrabold tracking-tighter sm:text-8xl lg:text-9xl">
                {score}
                <span className="text-primary">%</span>
              </p>
              <p className="mt-2 text-lg text-muted-foreground sm:text-xl">
                {t("landing.readiness.scoreLabel")}
              </p>
            </div>
            <div className="mt-6 hidden h-28 w-28 shrink-0 sm:mt-0 sm:block">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/50" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="263.9"
                  strokeDashoffset={263.9 * (1 - score / 100)}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
            </div>
          </div>
          <div className="mt-8 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-brand-accent to-emerald-500"
              style={{ width: `${score}%` }}
            />
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {warnings.map((key) => (
              <li
                key={key}
                className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5 text-sm font-medium sm:text-base"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                {t(`landing.readiness.${key}`)}
              </li>
            ))}
            {successes.map((key) => (
              <li
                key={key}
                className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3.5 text-sm font-medium sm:text-base"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                {t(`landing.readiness.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function PillarIcon({ pillar }: { pillar: "plan" | "money" | "moveDay" | "pilot" }) {
  const icons = {
    plan: CheckCircle2,
    money: Wallet,
    moveDay: MapPin,
    pilot: Bot,
  };
  const Icon = icons[pillar];
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Icon className="h-6 w-6" strokeWidth={1.75} />
    </div>
  );
}
