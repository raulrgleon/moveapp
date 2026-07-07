"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import { refreshMoveData } from "@/lib/move/refresh-data";

interface PendingInvite {
  id: string;
  token: string | null;
  ownerName: string;
  origin: string;
  destination: string;
  role: string;
}

export function PendingInvitesBanner() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch("/api/user/pending-invites");
        const data = (await res.json()) as { invites: PendingInvite[] };
        setInvites(data.invites.filter((i) => i.token));
      } catch {
        setInvites([]);
      }
    })();
  }, []);

  if (invites.length === 0) return null;

  const accept = async (token: string) => {
    setAccepting(token);
    try {
      await apiFetch("/api/move/invite", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setInvites((prev) => prev.filter((i) => i.token !== token));
      if (user?.email) await refreshMoveData(user.email);
      router.refresh();
    } finally {
      setAccepting(null);
    }
  };

  const invite = invites[0];

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm">{t("collaboration.pendingBannerTitle")}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("collaboration.pendingBannerDesc", {
              name: invite.ownerName,
              route: `${invite.origin} → ${invite.destination}`,
            })}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        disabled={!invite.token || accepting === invite.token}
        onClick={() => invite.token && void accept(invite.token)}
        className="shrink-0"
      >
        {accepting === invite.token ? t("invite.accepting") : t("invite.accept")}
      </Button>
    </div>
  );
}
