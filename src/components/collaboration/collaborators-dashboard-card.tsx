"use client";

import Link from "next/link";
import { ArrowRight, UserPlus, Users } from "lucide-react";
import { TeamMemberAvatar } from "@/components/collaboration/team-member-avatar";
import { useMoveTeam } from "@/hooks/use-move-team";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CollaboratorsDashboardCard() {
  const t = useT();
  const { moveRole, ownerName } = useMove();
  const { team, loading, acceptedCount, pendingCount } = useMoveTeam();

  const members = [
    ...(team.owner ? [{ name: team.owner.name, email: team.owner.email }] : []),
    ...team.collaborators
      .filter((c) => c.acceptedAt)
      .map((c) => ({
        name: c.user?.name ?? c.email,
        email: c.email,
      })),
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {t("collaboration.teamTitle")}
          </CardTitle>
          {pendingCount > 0 && (
            <Badge variant="secondary">
              {t("collaboration.pendingCount", { count: pendingCount })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {moveRole !== "owner" && ownerName && (
          <p className="text-sm text-muted-foreground">
            {t("settings.collaboratingAs", { role: moveRole, owner: ownerName })}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((m) => (
                  <TeamMemberAvatar
                    key={m.email}
                    name={m.name}
                    size="sm"
                    className="ring-2 ring-card"
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {t("collaboration.memberCount", { count: acceptedCount })}
              </span>
            </div>

            {moveRole === "owner" && team.collaborators.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("collaboration.emptyTeam")}</p>
            )}
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {moveRole === "owner" && (
            <Button size="sm" asChild>
              <Link href="/collaboration">
                <UserPlus className="h-4 w-4 mr-2" />
                {t("collaboration.inviteFamily")}
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" asChild className="sm:ml-auto">
            <Link href="/collaboration">
              {t("collaboration.manageTeam")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
