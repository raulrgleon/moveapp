"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Map,
  Shield,
  Truck,
  Wallet,
} from "lucide-react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { useT } from "@/contexts/locale-context";
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo showTagline />
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              {t("landing.features")}
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              {t("landing.howItWorks")}
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">{t("landing.logIn")}</Link>
            </Button>
            <Button asChild>
              <Link href="/onboarding">{t("landing.startMove")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            {t("landing.badge")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-balance">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/onboarding">
                {t("landing.planMove")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">{t("landing.viewDemo")}</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{t("landing.freeStart")}</p>
        </div>

        <div className="mt-16 rounded-2xl border bg-card shadow-xl overflow-hidden">
          <div className="border-b bg-muted/30 px-6 py-3 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-2 text-xs text-muted-foreground">movepilot.ai/dashboard</span>
          </div>
          <div className="p-6 sm:p-8 bg-gradient-to-br from-background to-muted/20">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t("landing.movingRoute")}</p>
                  <p className="mt-1 font-semibold">Austin, TX → Huntington, WV</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t("landing.estimatedBudget")}</p>
                  <p className="mt-1 font-semibold">$4,250</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t("landing.progress")}</p>
                  <p className="mt-1 font-semibold">
                    {t("landing.progressComplete", { percent: 37 })}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">{t("landing.featuresTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{t("landing.featuresSubtitle")}</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.titleKey} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{t(feature.titleKey)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(feature.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">{t("landing.howTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{t("landing.howSubtitle")}</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-primary py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mt-4 text-primary-foreground/80">{t("landing.ctaSubtitle")}</p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/onboarding">
              {t("landing.getStarted")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-sm text-muted-foreground">{t("landing.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
