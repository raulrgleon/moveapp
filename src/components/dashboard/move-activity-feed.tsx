"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useLocale, useT } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatActivityLabel, type MoveActivityItem } from "@/lib/move/activity";
import { formatDate } from "@/lib/utils";

export function MoveActivityFeed() {
  const t = useT();
  const { locale } = useLocale();
  const [activities, setActivities] = useState<MoveActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch("/api/move/activity?limit=10");
        const json = (await res.json()) as { activities: MoveActivityItem[] };
        if (!cancelled) setActivities(json.activities ?? []);
      } catch {
        if (!cancelled) setActivities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          {t("dashboardPage.recentActivity")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboardPage.noActivity")}</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="flex gap-3 text-sm">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                <div className="min-w-0">
                  <p className="font-medium">{formatActivityLabel(activity, locale)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(activity.createdAt.slice(0, 10), locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
