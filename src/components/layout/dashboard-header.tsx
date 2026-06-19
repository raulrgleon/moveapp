"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { LanguageToggle } from "./language-toggle";
import { MobileNav } from "./mobile-nav";
import { UserAccountMenu } from "./user-account-menu";
import { DashboardSearch } from "./dashboard-search";
import { NotificationsBell } from "./notifications-bell";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const t = useT();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top overflow-visible">
      <div className="flex h-14 sm:h-16 items-center gap-1 sm:gap-2 px-2 sm:px-4 lg:px-8 min-w-0">
        <MobileNav />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-lg font-semibold tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {description}
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 max-w-sm flex-1 min-w-0">
          <DashboardSearch />
        </div>
        <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden h-9 w-9">
              <Search className="h-4 w-4" />
              <span className="sr-only">{t("common.search")}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="pt-8">
            <SheetHeader className="mb-4">
              <SheetTitle>{t("common.search")}</SheetTitle>
            </SheetHeader>
            <DashboardSearch
              onNavigate={() => setSearchOpen(false)}
              autoFocus
            />
          </SheetContent>
        </Sheet>
        <LanguageToggle showLabel={false} className="hidden sm:flex shrink-0 h-9 w-9 sm:h-10 sm:w-auto" />
        <NotificationsBell />
        <UserAccountMenu />
      </div>
    </header>
  );
}
