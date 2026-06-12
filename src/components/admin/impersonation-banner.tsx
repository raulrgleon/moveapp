"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { invalidateUserData } from "@/lib/data-cache";

export function ImpersonationBanner() {
  const t = useT();
  const router = useRouter();
  const { isImpersonating, refreshUser } = useAuth();

  if (!isImpersonating) return null;

  async function stopImpersonating() {
    await apiFetch("/api/admin/impersonate", { method: "DELETE" });
    invalidateUserData();
    await refreshUser();
    router.push("/admin");
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
      <span>{t("adminConsole.impersonating")}</span>
      <Button size="sm" variant="secondary" onClick={() => void stopImpersonating()}>
        {t("adminConsole.stopImpersonating")}
      </Button>
    </div>
  );
}
