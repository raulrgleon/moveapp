"use client";

import { usePathname } from "next/navigation";
import { ADMIN_CONSOLE_NAV, isDashboardAppPath } from "@/lib/constants";
import { FloatingPilotWidget } from "./floating-pilot-widget";

function shouldShowWidget(pathname: string): boolean {
  if (isDashboardAppPath(pathname)) return false;
  for (const path of ADMIN_CONSOLE_NAV.map((n) => n.href)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) return false;
  }
  return true;
}

/** Site-wide floating Pilot chat for visitors (hidden in app dashboard/admin). */
export function FloatingPilotLauncher() {
  const pathname = usePathname() ?? "/";

  if (!shouldShowWidget(pathname)) {
    return null;
  }

  return <FloatingPilotWidget />;
}
