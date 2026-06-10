"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { MOCK_USER } from "@/lib/mock-data";
import { daysUntil, formatDate } from "@/lib/utils";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();
  const daysLeft = daysUntil(MOCK_USER.moveDate);

  return (
    <aside className="hidden lg:flex lg:w-60 xl:w-64 lg:flex-col lg:border-r lg:bg-card shrink-0">
      <div className="flex h-16 items-center border-b px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
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
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">
            {t("sidebar.moveInDays", { days: daysLeft })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(MOCK_USER.moveDate)}
          </p>
        </div>
      </div>
    </aside>
  );
}
