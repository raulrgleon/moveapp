"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMove } from "@/contexts/move-context";
import { isMoveSetupIncomplete } from "@/lib/move/profile-completeness";

const BYPASS_PREFIXES = ["/settings", "/onboarding"];

export function MoveSetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isHydrated, canEditProfile, moveRole } = useMove();

  useEffect(() => {
    if (!isHydrated) return;
    const bypass = BYPASS_PREFIXES.some((p) => pathname.startsWith(p));
    const isOwner = moveRole === "owner" && canEditProfile;
    if (!bypass && isOwner && isMoveSetupIncomplete(profile)) {
      router.replace("/onboarding?complete=1");
    }
  }, [isHydrated, profile, pathname, router, canEditProfile, moveRole]);

  return <>{children}</>;
}
