"use client";

import { LanguageToggle } from "./language-toggle";
import { MobileNav } from "./mobile-nav";
import { UserAccountMenu } from "./user-account-menu";
import { DashboardSearch } from "./dashboard-search";
import { NotificationsBell } from "./notifications-bell";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
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
        <div className="hidden md:flex items-center gap-2 max-w-sm flex-1 min-w-0">
          <DashboardSearch />
        </div>
        <LanguageToggle showLabel={false} className="shrink-0" />
        <NotificationsBell />
        <UserAccountMenu />
      </div>
    </header>
  );
}
