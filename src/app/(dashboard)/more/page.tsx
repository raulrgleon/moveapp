"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Crown, LayoutGrid } from "lucide-react";
import { UpgradeProBanner } from "@/components/billing/upgrade-pro-banner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { NAV_ITEMS } from "@/lib/constants";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const MOBILE_MORE_HREFS = new Set([
  "/route",
  "/trucks",
  "/vehicles",
  "/utilities",
  "/city-comparison",
  "/inventory",
  "/documents",
  "/collaboration",
  "/partner",
  "/assistant",
  "/move-day",
  "/settings",
]);

export default function MorePage() {
  const t = useT();
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => MOBILE_MORE_HREFS.has(item.href));

  return (
    <>
      <DashboardHeader title={t("mobileNav.more")} description={t("morePage.subtitle")} />
      <PageContainer>
        <PageHeader title={t("mobileNav.more")} description={t("morePage.subtitle")} />

        <UpgradeProBanner />

        <Link href="/upgrade" className="block mb-3">
          <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
            <CardContent className="flex items-center gap-4 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <Crown className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="font-medium">{t("upgrade.sidebarTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("upgrade.moreHint")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Card
                  className={cn(
                    "transition-all hover:border-primary/40 hover:shadow-md",
                    active && "border-primary bg-primary/5"
                  )}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{t(item.labelKey)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          <Link href="/assistant">
            <Card className="transition-all hover:border-primary/40 hover:shadow-md border-dashed">
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl brand-cta-gradient">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </span>
                <div>
                  <p className="font-medium">{t("brand.pilotName")}</p>
                  <p className="text-xs text-muted-foreground">{t("morePage.pilotHint")}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="mt-4 bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3 text-sm text-muted-foreground">
            <LayoutGrid className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{t("morePage.desktopHint")}</p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
