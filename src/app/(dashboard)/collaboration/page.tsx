"use client";

import { CollaborationPanel } from "@/components/collaboration/collaboration-panel";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { Card, CardContent } from "@/components/ui/card";

export default function CollaborationPage() {
  const t = useT();
  const { moveRole, ownerName } = useMove();

  return (
    <>
      <DashboardHeader
        title={t("collaboration.pageTitle")}
        description={t("collaboration.pageDesc")}
      />
      <PageContainer className="max-w-3xl">
        {moveRole !== "owner" && ownerName && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-sm">
              {t("settings.collaboratingAs", { role: moveRole, owner: ownerName })}
            </CardContent>
          </Card>
        )}
        <CollaborationPanel variant="full" />
      </PageContainer>
    </>
  );
}
