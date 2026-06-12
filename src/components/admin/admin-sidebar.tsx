"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_CONSOLE_NAV } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { Shield } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useT();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex lg:w-60 xl:w-64 lg:flex-col lg:border-r lg:bg-card shrink-0">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="h-5 w-5 text-primary" />
        <Logo />
      </div>
      <p className="px-4 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("adminConsole.consoleTitle")}
      </p>
      <nav className="flex-1 space-y-1 p-4">
        {ADMIN_CONSOLE_NAV.map((item) => {
          const isActive =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
        {user && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate" title={user.email}>
              {user.email}
            </p>
            <LogoutButton variant="outline" size="sm" className="w-full" />
          </div>
        )}
      </div>
    </aside>
  );
}
