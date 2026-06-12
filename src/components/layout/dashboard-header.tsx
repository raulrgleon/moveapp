"use client";

import { Bell, Search } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "./language-toggle";
import { MobileNav } from "./mobile-nav";
import { UserAccountMenu } from "./user-account-menu";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const t = useT();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top overflow-visible">
      <div className="flex h-14 sm:h-16 items-center gap-1.5 sm:gap-3 px-3 sm:px-4 lg:px-8 min-w-0">
        <MobileNav />
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
              {description}
            </p>
          )}
        </div>
        <div className="hidden lg:flex items-center gap-2 max-w-sm flex-1">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t("common.search")} className="pl-9 h-9" />
          </div>
        </div>
        <LanguageToggle showLabel={false} className="shrink-0" />
        <Button variant="ghost" size="icon" className="shrink-0 hidden sm:inline-flex">
          <Bell className="h-4 w-4" />
          <span className="sr-only">{t("common.notifications")}</span>
        </Button>
        <UserAccountMenu />
      </div>
    </header>
  );
}
