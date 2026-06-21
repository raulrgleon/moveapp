"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { AppGuideDocumentationCard } from "@/components/admin/app-guide-documentation-card";

type NotificationStatus = {
  ready: boolean;
  missing: string[];
  email: { configured: boolean; from: string | null };
  sms: {
    configured: boolean;
    phone: string | null;
    missing: string[];
    authMethod: string | null;
  };
};

export default function AdminMaintenancePage() {
  const t = useT();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [testSmsTo, setTestSmsTo] = useState("");
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);

  async function run(
    action:
      | "cleanup-sessions"
      | "run-reminders"
      | "notification-status"
      | "test-email"
      | "verify-twilio"
      | "test-sms"
  ) {
    setLoading(true);
    setResult("");
    try {
      const body =
        action === "test-sms"
          ? JSON.stringify({ to: testSmsTo.trim() || undefined })
          : action === "test-email"
            ? JSON.stringify({})
            : undefined;
      const res = await apiFetch(`/api/admin/maintenance/${action}`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (action === "notification-status") {
        setNotificationStatus(data);
      }
      if (action === "verify-twilio" || action === "test-sms") {
        const statusRes = await apiFetch("/api/admin/maintenance/notification-status", {
          method: "POST",
        });
        setNotificationStatus((await statusRes.json()) as NotificationStatus);
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
      <AdminPageContainer className="max-w-3xl space-y-6">
        <AppGuideDocumentationCard />

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
                <Badge variant={notificationStatus.sms.configured ? "default" : "secondary"}>
                  {notificationStatus.sms.configured
                    ? t("adminConsole.smsReady")
                    : t("adminConsole.smsMissing")}
                </Badge>
                {notificationStatus.email.from && (
                  <Badge variant="outline">From: {notificationStatus.email.from}</Badge>
                )}
                {notificationStatus.sms.phone && (
                  <Badge variant="outline">SMS: {notificationStatus.sms.phone}</Badge>
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
              <Button variant="outline" disabled={loading} onClick={() => void run("verify-twilio")}>
                {t("adminConsole.verifyTwilio")}
              </Button>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="test-sms-to">{t("adminConsole.testSmsTo")}</Label>
              <Input
                id="test-sms-to"
                type="tel"
                placeholder="+15551234567"
                value={testSmsTo}
                onChange={(e) => setTestSmsTo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("adminConsole.testSmsHint")}</p>
              <Button variant="outline" disabled={loading} onClick={() => void run("test-sms")}>
                {t("adminConsole.sendTestSms")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </AdminPageContainer>
    </>
  );
}
