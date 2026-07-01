"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

const MORE_SECTION_PATHS = [
  "/more",
  "/route",
  "/trucks",
  "/vehicles",
  "/utilities",
  "/city-comparison",
  "/inventory",
  "/shopping-list",
  "/documents",
  "/collaboration",
  "/partner",
  "/assistant",
  "/move-day",
  "/settings",
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden safe-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/more" && MORE_SECTION_PATHS.some((p) => pathname.startsWith(p)));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 px-1 min-w-0 rounded-lg transition-all duration-300",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute -top-0.5 h-1 w-8 rounded-full brand-cta-gradient" />
              )}
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                  isActive && "bg-primary/15 shadow-md shadow-primary/20"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              </span>
              <span className="text-[11px] font-medium truncate max-w-full">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
