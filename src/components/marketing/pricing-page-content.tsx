"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { PricingPlansSection } from "@/components/marketing/pricing-plans-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@movepilotai.com";

export function PricingPageContent() {
  const t = useT();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo showTagline size="md" />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">{t("landing.logIn")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <Button variant="ghost" size="sm" asChild className="mb-8 -ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("legal.backHome")}
          </Link>
        </Button>

        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            {t("pricing.eyebrow")}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">
            {t("pricing.title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("pricing.subtitle")}</p>
        </div>

        <div className="mt-12">
          <PricingPlansSection variant="full" />
        </div>

        <Card className="mt-12 max-w-2xl mx-auto border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground space-y-3">
            <p className="font-medium text-foreground">{t("pricing.questionsTitle")}</p>
            <p>{t("pricing.questionsDesc")}</p>
            <Button variant="link" asChild>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t("pricing.emailSubject"))}`}
              >
                {SUPPORT_EMAIL}
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
