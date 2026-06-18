"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Map,
  MessageSquare,
  Shield,
  Sparkles,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { PilotBadge } from "@/components/brand/pilot-badge";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { useT } from "@/contexts/locale-context";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingPlansSection } from "@/components/marketing/pricing-plans-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPageContent() {
  const t = useT();

  const features = [
    { icon: Bot, titleKey: "landing.featureAiPlan", descKey: "landing.featureAiPlanDesc" },
    { icon: Wallet, titleKey: "landing.featureBudget", descKey: "landing.featureBudgetDesc" },
    { icon: Map, titleKey: "landing.featureRoute", descKey: "landing.featureRouteDesc" },
    { icon: Truck, titleKey: "landing.featureTrucks", descKey: "landing.featureTrucksDesc" },
    {
      icon: CheckCircle2,
      titleKey: "landing.featureChecklist",
      descKey: "landing.featureChecklistDesc",
    },
    {
      icon: Shield,
      titleKey: "landing.featureDocuments",
      descKey: "landing.featureDocumentsDesc",
    },
  ];

  const steps = [
    { step: "1", titleKey: "landing.step1Title", descKey: "landing.step1Desc" },
    { step: "2", titleKey: "landing.step2Title", descKey: "landing.step2Desc" },
    { step: "3", titleKey: "landing.step3Title", descKey: "landing.step3Desc" },
  ];

  const pilotFeatures = [
    t("landing.pilotFeature1"),
    t("landing.pilotFeature2"),
    t("landing.pilotFeature3"),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo showTagline size="md" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#pilot" className="hover:text-foreground transition-colors">
              Pilot
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              {t("landing.features")}
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              {t("landing.howItWorks")}
            </a>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              {t("landing.pricing")}
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">{t("landing.logIn")}</Link>
            </Button>
            <Button asChild className="shadow-md shadow-primary/20">
              <Link href="/onboarding">{t("landing.startMove")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="brand-hero-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--brand-accent)/0.08),transparent_50%)] pointer-events-none" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in">
              <div className="brand-pill mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                {t("landing.badge")}
              </div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1] text-balance">
                {t("landing.heroTitle")}{" "}
                <span className="brand-ai">{t("landing.heroTitleAccent")}</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed text-balance max-w-xl">
                {t("landing.heroSubtitle")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Button size="lg" asChild className="h-12 px-8 text-base shadow-lg shadow-primary/25">
                  <Link href="/onboarding">
                    {t("landing.planMove")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                  <Link href="/dashboard">{t("landing.viewDemo")}</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">{t("landing.freeStart")}</p>
            </div>

            <div className="relative animate-fade-in">
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-blue/20 via-transparent to-brand-accent/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border bg-card shadow-2xl shadow-brand-navy/10 overflow-hidden brand-card-shine">
                <div className="border-b bg-muted/40 px-5 py-3 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400/90" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/90" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/90" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground">
                    movepilotai.com/dashboard
                  </span>
                </div>
                <div className="p-5 sm:p-6 bg-gradient-to-br from-background via-background to-brand-accent-soft/30">
                  <div className="grid gap-3 sm:grid-cols-3 mb-4">
                    <Card className="border-brand-blue/10 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t("landing.movingRoute")}
                        </p>
                        <p className="mt-1.5 text-sm font-semibold leading-snug">
                          Austin, TX → Huntington, WV
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-brand-blue/10 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t("landing.estimatedBudget")}
                        </p>
                        <p className="mt-1.5 text-sm font-semibold">$4,250</p>
                      </CardContent>
                    </Card>
                    <Card className="border-brand-blue/10 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t("landing.progress")}
                        </p>
                        <p className="mt-1.5 text-sm font-semibold text-brand-blue">
                          {t("landing.progressComplete", { percent: 37 })}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <PilotBadge
                      title={t("brand.pilotName")}
                      subtitle={t("brand.pilotRole")}
                      size="sm"
                    />
                    <div className="mt-3 flex gap-2">
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-xs text-muted-foreground max-w-[85%]">
                        {t("chat.welcome")}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <div className="rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-xs text-primary-foreground max-w-[75%]">
                        What should I do next?
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-primary mb-8">
            {t("landing.socialProofTitle")}
          </p>
          <div className="grid gap-6 sm:grid-cols-3 mb-10">
            {[
              { stat: t("landing.socialStatMoves"), label: t("landing.socialStatMovesLabel") },
              { stat: t("landing.socialStatMiles"), label: t("landing.socialStatMilesLabel") },
              { stat: t("landing.socialStatSaved"), label: t("landing.socialStatSavedLabel") },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <p className="font-display text-3xl sm:text-4xl font-bold brand-ai">{item.stat}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <blockquote className="mx-auto max-w-2xl text-center">
            <p className="text-lg font-medium text-foreground">{t("landing.socialTestimonial")}</p>
            <footer className="mt-3 text-sm text-muted-foreground">{t("landing.socialTestimonialAuthor")}</footer>
          </blockquote>
        </div>
      </section>

      <section id="pilot" className="border-y bg-brand-navy text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="brand-auth-glow absolute inset-0 pointer-events-none opacity-60" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-brand-accent font-semibold text-sm uppercase tracking-widest mb-4">
                {t("landing.pilotEyebrow")}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                {t("landing.pilotTitle")}
              </h2>
              <p className="mt-5 text-lg text-white/75 leading-relaxed">
                {t("landing.pilotDesc")}
              </p>
              <ul className="mt-8 space-y-3">
                {pilotFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-white/90">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Zap className="h-4 w-4 text-brand-accent" />
                    </span>
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                variant="secondary"
                className="mt-10 bg-white text-brand-navy hover:bg-white/90"
                asChild
              >
                <Link href="/onboarding">
                  {t("landing.planMove")}
                  <MessageSquare className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-3xl scale-75" />
                <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 sm:p-10">
                  <PilotBadge
                    title={t("brand.pilotName")}
                    subtitle={t("brand.pilotRole")}
                    size="md"
                    className="[&_p:first-child]:text-white [&_p:last-child]:text-white/60"
                  />
                  <p className="mt-6 text-white/80 leading-relaxed">{t("brand.pilotIntro")}</p>
                  <div className="mt-6 space-y-2">
                    {["Budget on track ✓", "3 tasks due this week", "Route: 14h drive"].map(
                      (item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-brand-accent shrink-0" />
                          {item}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("landing.featuresSubtitle")}</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.titleKey}
                className="group border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 brand-card-shine"
              >
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-brand-accent/10 group-hover:from-primary/20 group-hover:to-brand-accent/15 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-5 font-semibold text-base">{t(feature.titleKey)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              {t("landing.howTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("landing.howSubtitle")}</p>
          </div>
          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {steps.map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-primary/40 to-primary/10" />
                )}
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-brand-blue text-white font-bold shadow-lg shadow-brand-blue/20">
                  {item.step}
                </div>
                <h3 className="mt-5 font-semibold text-base">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(item.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 sm:py-28 border-t bg-gradient-to-b from-primary/[0.04] to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              {t("pricing.eyebrow")}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
              {t("landing.pricingSectionTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("landing.pricingSectionSubtitle")}</p>
          </div>
          <PricingPlansSection variant="compact" />
          <p className="mt-8 text-center">
            <Link href="/pricing" className="text-sm text-primary font-medium hover:underline">
              {t("landing.pricing")} →
            </Link>
          </p>
        </div>
      </section>

      <section className="brand-cta-gradient py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--brand-accent)/0.15),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center relative">
          <h2 className="font-display text-2xl font-bold text-white sm:text-4xl text-balance">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">{t("landing.ctaSubtitle")}</p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-10 h-12 px-8 text-base bg-white text-brand-navy hover:bg-white/90 shadow-xl"
            asChild
          >
            <Link href="/onboarding">
              {t("landing.getStarted")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-6 text-sm text-white/70 max-w-md mx-auto">{t("landing.freeStart")}</p>
          <p className="mt-6 text-sm text-white/50 font-mono">movepilotai.com</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
