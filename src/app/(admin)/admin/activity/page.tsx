"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CheckSquare,
  FileText,
  Handshake,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Truck,
  User,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale, useT } from "@/contexts/locale-context";
import {
  formatActivityLabel,
  groupActivitiesByDay,
  type ActivityCategory,
  type ActivityDashboardResult,
  type ActivitySource,
  type UnifiedActivityItem,
} from "@/lib/admin/activity-dashboard";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<Exclude<ActivityCategory, "all">, typeof Activity> = {
  admin: Shield,
  users: Users,
  moves: MapPin,
  profile: User,
  budget: Wallet,
  checklist: CheckSquare,
  documents: FileText,
  collaboration: Users,
  utilities: Zap,
  trucks: Truck,
  partners: Handshake,
  system: Settings,
};

const SOURCE_STYLES: Record<ActivitySource, string> = {
  admin: "border-l-violet-500 bg-violet-500/5",
  user: "border-l-sky-500 bg-sky-500/5",
  partner: "border-l-amber-500 bg-amber-500/5",
};

function formatTime(iso: string, locale: "en" | "es"): string {
  return new Date(iso).toLocaleTimeString(locale === "es" ? "es-US" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminActivityPage() {
  const t = useT();
  const { locale } = useLocale();
  const [data, setData] = useState<ActivityDashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"all" | ActivitySource>("all");
  const [category, setCategory] = useState<ActivityCategory>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "150",
        source,
        category,
      });
      if (query.trim()) params.set("q", query.trim());
      const res = await apiFetch(`/api/admin/activity?${params.toString()}`);
      setData((await res.json()) as ActivityDashboardResult);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [source, category, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(
    () => groupActivitiesByDay(data?.items ?? [], locale),
    [data?.items, locale]
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of data?.summary.byCategory ?? []) {
      map.set(row.category, row.count);
    }
    return map;
  }, [data?.summary.byCategory]);

  const categories: ActivityCategory[] = [
    "all",
    "profile",
    "budget",
    "checklist",
    "documents",
    "collaboration",
    "utilities",
    "trucks",
    "partners",
    "users",
    "moves",
    "admin",
    "system",
  ];

  return (
    <>
      <AdminHeader
        title={t("adminConsole.activity")}
        description={t("adminActivity.pageDesc")}
      />
      <PageContainer>
        <PageHeader
          title={t("adminActivity.pageTitle")}
          description={t("adminActivity.pageDesc")}
          action={
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              {t("common.update")}
            </Button>
          }
        />

        {data && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("adminActivity.todayTotal")}</p>
                <p className="text-2xl font-bold">{data.summary.totalToday}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("adminActivity.weekTotal")}</p>
                <p className="text-2xl font-bold">{data.summary.totalWeek}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("adminActivity.userActionsToday")}</p>
                <p className="text-2xl font-bold text-sky-600">{data.summary.userToday}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("adminActivity.adminActionsToday")}</p>
                <p className="text-2xl font-bold text-violet-600">{data.summary.adminToday}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("adminActivity.partnerActionsToday")}</p>
                <p className="text-2xl font-bold text-amber-600">{data.summary.partnerToday}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["all", "user", "admin", "partner"] as const).map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={source === key ? "default" : "outline"}
                  onClick={() => setSource(key)}
                >
                  {t(`adminActivity.source.${key}`)}
                </Button>
              ))}
            </div>

            <form
              className="flex gap-2 flex-wrap"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(search);
              }}
            >
              <div className="relative flex-1 min-w-[12rem]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t("adminActivity.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit">{t("adminActivity.search")}</Button>
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setQuery("");
                  }}
                >
                  {t("adminActivity.clearSearch")}
                </Button>
              )}
            </form>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const count = cat === "all" ? data?.summary.totalWeek : categoryCounts.get(cat);
                return (
                  <Button
                    key={cat}
                    size="sm"
                    variant={category === cat ? "secondary" : "ghost"}
                    className="h-8"
                    onClick={() => setCategory(cat)}
                  >
                    {t(`adminActivity.categories.${cat}`)}
                    {count != null && count > 0 && (
                      <Badge variant="outline" className="ml-2 text-[10px] px-1.5">
                        {count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {loading && !data ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : !data?.items.length ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              {t("adminActivity.empty")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.dayKey} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground sticky top-16 bg-background/95 py-2 z-10">
                  {group.dayLabel}
                </h2>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <ActivityRow key={item.id} item={item} locale={locale} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}

function ActivityRow({
  item,
  locale,
}: {
  item: UnifiedActivityItem;
  locale: "en" | "es";
}) {
  const t = useT();
  const Icon = CATEGORY_ICONS[item.category] ?? Activity;
  const label = formatActivityLabel(item, locale);

  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 p-4 flex flex-col sm:flex-row sm:items-start gap-3",
        SOURCE_STYLES[item.source]
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background border">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium leading-snug">{label}</p>
          <Badge variant="outline" className="text-[10px]">
            {t(`adminActivity.categories.${item.category}`)}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {t(`adminActivity.source.${item.source}`)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {item.actorName}
          {item.actorEmail ? ` · ${item.actorEmail}` : ""}
        </p>
        {item.moveRoute && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
            <MapPin className="h-3 w-3" />
            {item.moveRoute}
            {item.moveId && (
              <>
                {" · "}
                <Link href={`/admin/moves/${item.moveId}`} className="text-primary hover:underline">
                  {t("adminConsole.viewDetails")}
                </Link>
              </>
            )}
          </p>
        )}
        {item.details && Object.keys(item.details).length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">{t("adminActivity.details")}</summary>
            <pre className="mt-2 overflow-x-auto rounded bg-muted/50 p-2 font-mono text-[11px]">
              {JSON.stringify(item.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
      <time className="text-xs text-muted-foreground shrink-0 tabular-nums">
        {formatTime(item.createdAt, locale)}
      </time>
    </div>
  );
}
