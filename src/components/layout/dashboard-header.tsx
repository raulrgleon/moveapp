"use client";

import { Bell, Search } from "lucide-react";
import { MOCK_USER } from "@/lib/mock-data";
import { useT } from "@/contexts/locale-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "./mobile-nav";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const t = useT();
  const initials = MOCK_USER.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 lg:px-8">
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
        <Button variant="ghost" size="icon" className="shrink-0">
          <Bell className="h-4 w-4" />
          <span className="sr-only">{t("common.notifications")}</span>
        </Button>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
