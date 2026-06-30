"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import {
  LandingPremiumPanel,
  LandingWowReadiness,
  PillarIcon,
} from "@/components/landing/landing-visuals";
import { useT } from "@/contexts/locale-context";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";

const OUTCOMES = ["outcome1", "outcome2", "outcome3", "outcome4", "outcome5"] as const;
const PILLARS = ["plan", "money", "moveDay", "pilot"] as const;
const PILOT_EXAMPLES = ["example1", "example2", "example3"] as const;

export function LandingPageContent() {
  const t = useT();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo showTagline size="md" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#readiness" className="transition-colors hover:text-foreground">
              {t("landing.nav.product")}
            </a>
            <a href="#pilot" className="transition-colors hover:text-foreground">
              Pilot
            </a>
            <Link href="/pricing" className="transition-colors hover:text-foreground">
              {t("landing.pricing")}
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">{t("landing.logIn")}</Link>
            </Button>
            <Button asChild className="shadow-md shadow-primary/15">
              <Link href="/onboarding">{t("landing.nav.startPlanning")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-grid-bg relative">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-[2.75rem] font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
                {t("landing.hero.title")}
                <span className="mt-1 block text-foreground/75 sm:mt-2">
                  {t("landing.hero.titleAccent")}
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground text-balance lg:mx-0 lg:text-xl">
                {t("landing.hero.subtitle")}
              </p>
              <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:justify-start">
                <Button
                  size="lg"
                  asChild
                  className="h-12 px-8 text-base shadow-lg shadow-primary/25"
                >
                  <Link href="/onboarding">
                    {t("landing.hero.ctaPrimary")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                  <a href="#readiness">
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    {t("landing.hero.ctaSecondary")}
                  </a>
                </Button>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">{t("landing.hero.trust")}</p>
            </div>
            <div className="w-full lg:justify-self-end">
              <LandingPremiumPanel />
            </div>
          </div>
        </div>
      </section>

      {/* WOW — Readiness Score */}
      <section id="readiness" className="border-y border-border/50 bg-muted/30 py-16 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {t("landing.readiness.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">{t("landing.readiness.desc")}</p>
          </div>
          <div className="mt-14 lg:mt-16">
            <LandingWowReadiness />
          </div>
          <p className="mx-auto mt-10 max-w-xl text-center text-base font-medium text-foreground/80 sm:text-lg">
            {t("landing.readiness.hook")}
          </p>
          <div className="mt-8 flex justify-center">
            <Button size="lg" asChild>
              <Link href="/onboarding">
                {t("landing.hero.ctaPrimary")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Outcomes — not features */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {t("landing.outcomes.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              {t("landing.outcomes.title")}
            </h2>
          </div>
          <ul className="mx-auto mt-14 max-w-2xl divide-y divide-border/80">
            {OUTCOMES.map((key) => (
              <li
                key={key}
                className="flex items-center gap-4 py-5 text-lg font-medium sm:text-xl sm:py-6"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ArrowRight className="h-4 w-4" />
                </span>
                {t(`landing.outcomes.${key}`)}
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-12 max-w-xl text-center text-lg text-muted-foreground leading-relaxed">
            {t("landing.emotion.line")}
          </p>
        </div>
      </section>

      {/* 4 Pillars */}
      <section className="border-y border-border/50 bg-muted/20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              {t("landing.pillars.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("landing.pillars.subtitle")}</p>
          </div>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {PILLARS.map((key) => (
              <div key={key} className="text-center lg:text-left">
                <div className="mx-auto lg:mx-0">
                <PillarIcon pillar={key} />
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {t(`landing.pillars.${key}Label`)}
                </p>
                <p className="mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
                  {t(`landing.pillars.${key}Title`)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t(`landing.pillars.${key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilot */}
      <section
        id="pilot"
        className="relative overflow-hidden bg-[hsl(var(--brand-navy))] py-20 text-white sm:py-28"
      >
        <div className="brand-auth-glow pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center lg:max-w-none lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">
              {t("landing.pilot.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              {t("landing.pilot.title")}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/70">{t("landing.pilot.desc")}</p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <ul className="space-y-3 text-white/85">
              {(["knows1", "knows2", "knows3", "knows4", "knows5"] as const).map((key) => (
                <li key={key} className="flex items-center gap-3 text-base sm:text-lg">
                  <span className="h-1 w-1 rounded-full bg-brand-accent" />
                  {t(`landing.pilot.${key}`)}
                </li>
              ))}
            </ul>
            <div className="space-y-3">
              {PILOT_EXAMPLES.map((key) => (
                <div
                  key={key}
                  className="rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.06] px-5 py-4 text-base backdrop-blur"
                >
                  &ldquo;{t(`landing.pilot.${key}`)}&rdquo;
                </div>
              ))}
              <div className="rounded-2xl rounded-tr-md bg-primary px-5 py-4 text-base text-primary-foreground lg:ml-6">
                {t("landing.pilot.reply")}
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-center lg:justify-start">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-brand-navy hover:bg-white/90"
              asChild
            >
              <Link href="/onboarding">
                {t("landing.hero.ctaPrimary")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="brand-cta-gradient relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--brand-accent)/0.15),transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white sm:text-5xl text-balance">
            {t("landing.cta.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-white/80">{t("landing.cta.subtitle")}</p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-10 h-14 px-12 text-base bg-white text-brand-navy shadow-2xl hover:bg-white/95"
            asChild
          >
            <Link href="/onboarding">
              {t("landing.cta.button")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-5 text-sm text-white/65">{t("landing.cta.finePrint")}</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
