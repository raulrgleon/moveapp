"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  FileText,
  Loader2,
  MapPin,
  UserPlus,
  Users,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/contexts/locale-context";
import { useLocale } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  totalMoves: number;
  pendingInvites: number;
  usersToday: number;
  usersThisWeek: number;
  totalDocuments: number;
  overdueTasks: number;
  recentUsers: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    suspendedAt: string | null;
  }[];
}

interface Health {
  dbOk: boolean;
  dbLatencyMs: number;
  pm2Status: { online: boolean };
  diskFreeGb: number | null;
  integrations: Record<string, boolean>;
  notifications?: {
    ready: boolean;
    missing: string[];
    email: { configured: boolean; from: string | null };
    sms: { configured: boolean; phone: string | null };
  };
}

export default function AdminDashboardPage() {
  const t = useT();
  const { locale } = useLocale();
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, healthRes] = await Promise.all([
          apiFetch("/api/admin/stats"),
          apiFetch("/api/admin/health"),
        ]);
        setStats((await statsRes.json()) as Stats);
        setHealth((await healthRes.json()) as Health);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const statCards = stats
    ? [
        { label: t("adminConsole.totalUsers"), value: stats.totalUsers, icon: Users },
        { label: t("adminConsole.totalMoves"), value: stats.totalMoves, icon: MapPin },
        { label: t("adminConsole.pendingInvites"), value: stats.pendingInvites, icon: UserPlus },
        { label: t("adminConsole.usersToday"), value: stats.usersToday, icon: Activity },
        { label: t("adminConsole.usersWeek"), value: stats.usersThisWeek, icon: Activity },
        { label: t("adminConsole.totalDocuments"), value: stats.totalDocuments, icon: FileText },
      ]
    : [];

  return (
    <>
      <AdminHeader title={t("adminConsole.dashboard")} description={t("adminConsole.dashboardDesc")} />
      <PageContainer>
        <PageHeader title={t("adminConsole.dashboard")} description={t("adminConsole.dashboardDesc")} />

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((card) => (
                <Card key={card.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <card.icon className="h-4 w-4" />
                      {card.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {health && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("adminConsole.systemHealth")}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("adminConsole.database")}</p>
                    <Badge variant={health.dbOk ? "default" : "destructive"}>
                      {health.dbOk ? `${t("adminConsole.healthy")} (${health.dbLatencyMs}ms)` : t("adminConsole.unhealthy")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("adminConsole.pm2")}</p>
                    <Badge variant={health.pm2Status.online ? "default" : "destructive"}>
                      {health.pm2Status.online ? t("adminConsole.online") : t("adminConsole.offline")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("adminConsole.diskFree")}</p>
                    <p className="font-medium">{health.diskFreeGb ?? "—"} GB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("adminConsole.overdueTasks")}</p>
                    <p className="font-medium">{stats?.overdueTasks ?? 0}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {health && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("adminConsole.integrations")}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {Object.entries(health.integrations).map(([key, ok]) => (
                    <Badge key={key} variant={ok ? "default" : "secondary"}>
                      {key}: {ok ? t("adminConsole.configured") : t("adminConsole.missing")}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {health?.notifications && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("adminConsole.notifications")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Badge variant={health.notifications.ready ? "default" : "secondary"}>
                    {health.notifications.ready
                      ? t("adminConsole.notificationsReady")
                      : t("adminConsole.notificationsMissing")}
                  </Badge>
                  {health.notifications.email.from && (
                    <p className="text-muted-foreground">EMAIL_FROM: {health.notifications.email.from}</p>
                  )}
                  {health.notifications.missing.length > 0 && (
                    <p className="text-muted-foreground">
                      Missing: {health.notifications.missing.join(", ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {stats && stats.recentUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("adminConsole.recentUsers")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatDate(u.createdAt, locale)}</p>
                        {u.suspendedAt && (
                          <Badge variant="destructive" className="mt-1">{t("admin.suspended")}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <Link href="/admin/users" className="text-sm text-primary hover:underline">
                    {t("adminConsole.users")} →
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}
