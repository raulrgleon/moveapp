"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LoadingText } from "@/components/ui/loading-text";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isAdmin, isHydrated, router]);

  if (!isHydrated || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          <LoadingText />
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
