"use client";

import Link from "next/link";
import { CalendarCheck, MapPin, Package, Route, Truck } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { RouteWeatherPanel } from "@/components/dashboard/route-weather-panel";
import { useMove } from "@/contexts/move-context";
import { useChecklist } from "@/contexts/checklist-context";
import { useInventory } from "@/contexts/inventory-context";
import { useRouteStats } from "@/hooks/use-route-stats";
import { useLocale, useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";

export default function MoveDayPage() {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useMove();
  const { tasks } = useChecklist();
  const { boxes } = useInventory();
  const { stats } = useRouteStats();

  const moveDate = new Date(profile.moveDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  moveDate.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((moveDate.getTime() - today.getTime()) / 86400000);
  const isMoveDay = daysUntil === 0;
  const isPast = daysUntil < 0;

  const delivered = boxes.filter((b) => b.status === "delivered").length;
  const boxProgress = boxes.length ? Math.round((delivered / boxes.length) * 100) : 0;

  const travelTasks = tasks
    .filter((task) => task.category === "Travel" && task.status !== "completed")
    .slice(0, 5);

  return (
    <>
      <DashboardHeader title={t("moveDayPage.title")} description={t("moveDayPage.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("moveDayPage.pageTitle")}
          description={t("moveDayPage.pageDesc", {
            origin: profile.origin,
            destination: profile.destination,
          })}
        />

        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t("moveDayPage.moveDate")}</p>
                <p className="text-2xl font-bold">{formatDate(profile.moveDate, locale)}</p>
                <p className="text-sm mt-1">
                  {isMoveDay
                    ? t("moveDayPage.today")
                    : isPast
                      ? t("moveDayPage.past", { days: Math.abs(daysUntil) })
                      : t("moveDayPage.countdown", { days: daysUntil })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Route className="h-4 w-4" />
                {t("moveDayPage.route")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {stats ? (
                <>
                  <p>
                    {stats.distanceMiles.toLocaleString()} {t("routePage.miles")} · {stats.driveTimeLabel}
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href="/route">{t("moveDayPage.openRoute")}</Link>
                  </Button>
                </>
              ) : (
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href="/route">{t("moveDayPage.setupRoute")}</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t("moveDayPage.boxes")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>{t("moveDayPage.boxProgress", { delivered, total: boxes.length })}</p>
              <Progress value={boxProgress} />
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/inventory">{t("moveDayPage.trackBoxes")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {t("moveDayPage.transport")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground">{profile.rentalPreference}</p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/trucks">{t("moveDayPage.viewTrucks")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <RouteWeatherPanel />

        {travelTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("moveDayPage.travelTasks")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {travelTasks.map((task) => (
                <div key={task.id} className="rounded-lg border p-3 text-sm">
                  {task.title}
                </div>
              ))}
              <Button asChild size="sm" variant="link" className="px-0">
                <Link href="/checklist?category=Travel">{t("moveDayPage.allTravelTasks")}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  );
}
