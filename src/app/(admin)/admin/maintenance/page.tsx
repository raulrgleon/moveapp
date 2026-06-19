"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";

export default function AdminMaintenancePage() {
  const t = useT();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<{
    ready: boolean;
    missing: string[];
    email: { configured: boolean; from: string | null };
    sms: { configured: boolean; phone: string | null };
  } | null>(null);

  async function run(action: "cleanup-sessions" | "run-reminders" | "notification-status" | "test-email") {
    setLoading(true);
    setResult("");
    try {
      const res = await apiFetch(`/api/admin/maintenance/${action}`, {
        method: "POST",
        body: action === "test-email" ? JSON.stringify({}) : undefined,
      });
      const data = await res.json();
      if (action === "notification-status") {
        setNotificationStatus(data);
      }
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AdminHeader
        title={t("adminConsole.maintenance")}
        description={t("adminConsole.maintenanceDesc")}
      />
      <AdminPageContainer className="max-w-2xl space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminConsole.notifications")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificationStatus && (
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant={notificationStatus.ready ? "default" : "secondary"}>
                  {notificationStatus.ready
                    ? t("adminConsole.notificationsReady")
                    : t("adminConsole.notificationsMissing")}
                </Badge>
                {notificationStatus.email.from && (
                  <Badge variant="outline">From: {notificationStatus.email.from}</Badge>
                )}
                {notificationStatus.missing.map((key) => (
                  <Badge key={key} variant="destructive">
                    {key}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={loading} onClick={() => void run("notification-status")}>
                {t("adminConsole.checkNotificationStatus")}
              </Button>
              <Button variant="outline" disabled={loading} onClick={() => void run("test-email")}>
                {t("adminConsole.sendTestEmail")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </AdminPageContainer>
    </>
  );
}
