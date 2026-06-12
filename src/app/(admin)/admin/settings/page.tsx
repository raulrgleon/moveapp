"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";

export default function AdminSettingsPage() {
  const t = useT();
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/api/admin/settings");
        setHealth((await res.json()) as Record<string, unknown>);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const integrations = (health?.integrations ?? {}) as Record<string, boolean>;
  const env = (health?.env ?? {}) as Record<string, { configured: boolean; preview: string | null }>;

  return (
    <>
      <AdminHeader title={t("adminConsole.settings")} />
      <PageContainer className="max-w-3xl space-y-6">
        <PageHeader title={t("adminConsole.envStatus")} />
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("adminConsole.integrations")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Object.entries(integrations).map(([key, ok]) => (
                  <Badge key={key} variant={ok ? "default" : "secondary"}>
                    {key}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Environment variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(env).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b pb-2">
                    <span className="font-mono">{key}</span>
                    <span className="text-muted-foreground">
                      {val.configured ? val.preview : t("adminConsole.missing")}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">
                  App URL: {String(health?.appUrl ?? "—")} · Node: {String(health?.nodeEnv ?? "—")}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </PageContainer>
    </>
  );
}
