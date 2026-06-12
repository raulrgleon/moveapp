"use client";

import { AdminMobileNav } from "./admin-mobile-nav";
import { LanguageToggle } from "@/components/layout/language-toggle";

interface AdminHeaderProps {
  title: string;
  description?: string;
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
      <div className="flex h-14 sm:h-16 items-center gap-2 px-3 sm:px-4 lg:px-8 min-w-0">
        <AdminMobileNav />
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
              {description}
            </p>
          )}
        </div>
        <LanguageToggle showLabel={false} className="shrink-0" />
      </div>
    </header>
  );
}
