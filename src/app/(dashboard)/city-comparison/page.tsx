"use client";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { CityComparisonPanel } from "@/components/dashboard/city-comparison-panel";
import { useT } from "@/contexts/locale-context";

export default function CityComparisonPage() {
  const t = useT();
  return (
    <>
      <DashboardHeader
        title={t("nav.cityComparison")}
        description={t("cityComparison.pageDesc")}
      />
      <PageContainer>
        <PageHeader
          title={t("nav.cityComparison")}
          description={t("cityComparison.pageDescLong")}
        />
        <CityComparisonPanel />
      </PageContainer>
    </>
  );
}
