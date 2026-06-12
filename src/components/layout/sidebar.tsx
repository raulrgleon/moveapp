"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEM, NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";
import { useMove } from "@/contexts/move-context";
import { useLocale } from "@/contexts/locale-context";
import { daysUntil, formatDate } from "@/lib/utils";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { LogoutButton } from "@/components/auth/logout-button";

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();
  const { locale } = useLocale();
  const { isAdmin, user } = useAuth();
  const { profile } = useMove();
  const daysLeft = daysUntil(profile.moveDate);
  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <aside className="hidden lg:flex lg:w-60 xl:w-64 lg:flex-col lg:border-r lg:bg-card shrink-0">
      <div className="flex h-16 items-center border-b px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 space-y-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">
            {t("sidebar.moveInDays", { days: daysLeft })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(profile.moveDate, locale)}
          </p>
        </div>
        {user && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground truncate" title={user.email}>
              {user.name}
            </p>
            <LogoutButton variant="outline" size="sm" className="w-full" />
          </div>
        )}
      </div>
    </aside>
  );
}
