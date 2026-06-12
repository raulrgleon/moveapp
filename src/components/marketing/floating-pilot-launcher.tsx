"use client";

import { usePathname } from "next/navigation";
import { ADMIN_CONSOLE_NAV, NAV_ITEMS } from "@/lib/constants";
import { FloatingPilotWidget } from "./floating-pilot-widget";

const HIDDEN = [
  ...NAV_ITEMS.map((n) => n.href),
  ...ADMIN_CONSOLE_NAV.map((n) => n.href),
];

function shouldShowWidget(pathname: string): boolean {
  for (const path of HIDDEN) {
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
