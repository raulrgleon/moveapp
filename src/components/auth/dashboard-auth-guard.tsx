"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LoadingText } from "@/components/ui/loading-text";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          <LoadingText />
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
