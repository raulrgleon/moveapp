"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";

export default function AdminMaintenancePage() {
  const t = useT();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(action: "cleanup-sessions" | "run-reminders") {
    setLoading(true);
    setResult("");
    try {
      const res = await apiFetch(`/api/admin/maintenance/${action}`, { method: "POST" });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AdminHeader title={t("adminConsole.maintenance")} />
      <PageContainer className="max-w-2xl space-y-6">
        <PageHeader title={t("adminConsole.maintenance")} description={t("adminConsole.maintenanceDesc")} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminConsole.maintenance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button disabled={loading} onClick={() => void run("cleanup-sessions")}>
              {t("adminConsole.cleanupSessions")}
            </Button>
            <Button variant="outline" disabled={loading} onClick={() => void run("run-reminders")}>
              {t("adminConsole.runReminders")}
            </Button>
            {result && (
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">{result}</pre>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
