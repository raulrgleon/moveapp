"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { SiteFooter } from "@/components/marketing/site-footer";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";

type LegalPageShellProps = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  const t = useT();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" />
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("legal.backHome")}
          </Link>
        </Button>

        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("legal.lastUpdated")}: {lastUpdated}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
