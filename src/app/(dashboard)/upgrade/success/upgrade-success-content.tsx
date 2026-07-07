"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function UpgradeSuccessContent() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setState("error");
      return;
    }

    void (async () => {
      try {
        const res = await apiFetch(
          `/api/billing/verify?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = (await res.json()) as { paid?: boolean };
        if (!data.paid) throw new Error("not paid");
        await refreshUser();
        setState("ok");
      } catch {
        setState("error");
      }
    })();
  }, [searchParams, refreshUser]);

  return (
    <>
      <DashboardHeader title={t("upgrade.pageTitle")} description="" />
      <PageContainer className="max-w-lg">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            {state === "loading" && (
              <>
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">{t("upgrade.successVerifying")}</p>
              </>
            )}
            {state === "ok" && (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
                <h1 className="font-display text-xl font-bold">{t("upgrade.successTitle")}</h1>
                <p className="text-sm text-muted-foreground">{t("upgrade.successDesc")}</p>
                <Button className="w-full" onClick={() => router.push("/dashboard")}>
                  {t("upgrade.successDashboard")}
                </Button>
              </>
            )}
            {state === "error" && (
              <>
                <p className="text-sm text-destructive">{t("upgrade.successError")}</p>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/settings">{t("upgrade.planTitle")}</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
