"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/contexts/locale-context";
import { useLocale } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

export default function AdminMoveDetailPage({ params }: { params: { id: string } }) {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const [move, setMove] = useState<Record<string, unknown> | null>(null);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/api/admin/moves/${params.id}`);
        const data = (await res.json()) as { move: Record<string, unknown> };
        setMove(data.move);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        {t("common.loading")}
      </div>
    );
  }

  if (!move) {
    return <p className="p-8 text-destructive">Move not found</p>;
  }

  const user = move.user as { name: string; email: string; id: string };
  const tasks = (move.checklistTasks as { title: string; status: string; dueDate?: string }[]) ?? [];
  const docs = (move.documents as { name: string; status: string }[]) ?? [];
  const collabs = (move.collaborators as { email: string; role: string; acceptedAt?: string }[]) ?? [];

  return (
    <>
      <AdminHeader title={`${move.origin} → ${move.destination}` as string} />
      <PageContainer className="max-w-4xl space-y-6">
        <PageHeader
          title={`${String(move.origin)} → ${String(move.destination)}`}
          description={`${user.name} (${user.email})`}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminConsole.moveDate")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>{formatDate(String(move.moveDate), locale)}</p>
            <p>{t("settings.budget")}: ${String(move.budget)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("nav.checklist")} ({tasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.slice(0, 10).map((task, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{task.title}</span>
                <Badge variant="secondary">{task.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("nav.documents")} ({docs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {docs.map((d, i) => (
              <p key={i}>{d.name} — {d.status}</p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminConsole.pendingInvitations")} / Collabs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {collabs.map((c, i) => (
              <p key={i}>{c.email} ({c.role}) {c.acceptedAt ? "✓" : "pending"}</p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminConsole.transferOwnership")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>{t("adminConsole.newOwnerId")}</Label>
              <Input value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} />
            </div>
            <Button
              disabled={saving || !newOwnerId.trim()}
              onClick={async () => {
                setSaving(true);
                try {
                  await apiFetch(`/api/admin/moves/${params.id}/transfer`, {
                    method: "PATCH",
                    body: JSON.stringify({ newOwnerId: newOwnerId.trim() }),
                  });
                  setNewOwnerId("");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {t("adminConsole.transfer")}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">{t("adminConsole.deleteMove")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShowDelete(true)}>
              {t("adminConsole.deleteMove")}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminConsole.deleteMove")}</DialogTitle>
            <DialogDescription>
              {t("adminConsole.deleteMoveConfirm", {
                route: `${String(move.origin)} → ${String(move.destination)}`,
                owner: user.name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  await apiFetch(`/api/admin/moves/${params.id}`, { method: "DELETE" });
                  router.push("/admin/moves");
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? t("common.loading") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
