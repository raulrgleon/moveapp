"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Circle,
  MapPin,
  Package,
  Phone,
  Route,
  Truck,
} from "lucide-react";
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
  const { profile, truckChoice } = useMove();
  const { tasks, setTaskStatus } = useChecklist();
  const { boxes, setBoxStatus } = useInventory();
  const { stats } = useRouteStats();

  const moveDate = new Date(profile.moveDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  moveDate.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((moveDate.getTime() - today.getTime()) / 86400000);
  const isMoveDay = daysUntil === 0;
  const isPast = daysUntil < 0;

  const delivered = boxes.filter((b) => b.status === "delivered").length;
  const loaded = boxes.filter((b) => b.status === "in_transit").length;
  const boxProgress = boxes.length ? Math.round((delivered / boxes.length) * 100) : 0;

  const travelTasks = tasks
    .filter((task) => task.category === "Travel" && task.status !== "completed")
    .slice(0, 8);

  const pendingBoxes = boxes.filter((b) => b.status !== "delivered").slice(0, 6);

  return (
    <>
      <DashboardHeader title={t("moveDayPage.title")} description={t("moveDayPage.subtitle")} />
      <PageContainer>
        <div className="sticky top-14 sm:top-16 z-10 -mx-4 px-4 py-3 mb-4 bg-background/95 backdrop-blur border-b md:static md:border-0 md:bg-transparent md:backdrop-blur-none md:p-0">
          <PageHeader
            title={t("moveDayPage.pageTitle")}
            description={
              isMoveDay
                ? t("moveDayPage.today")
                : t("moveDayPage.countdown", { days: Math.max(0, daysUntil) })
            }
          />
        </div>

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
              {loaded > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("moveDayPage.boxesLoaded", { count: loaded })}
                </p>
              )}
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
              <p className="text-muted-foreground">
                {truckChoice ?? profile.rentalPreference}
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/trucks">{t("moveDayPage.viewTrucks")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t("moveDayPage.emergencyContacts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>{profile.name} · {profile.email}</p>
            <p className="text-muted-foreground">{t("moveDayPage.emergencyHint")}</p>
          </CardContent>
        </Card>

        {pendingBoxes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("moveDayPage.quickBoxActions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingBoxes.map((box) => (
                <div key={box.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                  <span>#{box.boxNumber}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setBoxStatus(box.id, "in_transit")}>
                      {t("moveDayPage.markLoaded")}
                    </Button>
                    <Button size="sm" onClick={() => setBoxStatus(box.id, "delivered")}>
                      {t("moveDayPage.markDelivered")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
                <div key={task.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary"
                    onClick={() => setTaskStatus(task.id, "completed")}
                    aria-label={t("checklistPage.markComplete")}
                  >
                    <Circle className="h-5 w-5" />
                  </button>
                  <span className="flex-1">{task.title}</span>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground opacity-0" />
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
