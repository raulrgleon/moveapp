"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { TableScroll } from "@/components/dashboard/table-scroll";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";

interface InviteRow {
  id: string;
  email: string;
  role: string;
  acceptedAt: string | null;
  move: { origin: string; destination: string; user: { name: string; email: string } };
}

export default function AdminInvitesPage() {
  const t = useT();
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/invites");
      const data = (await res.json()) as { invites: InviteRow[] };
      setInvites(data.invites);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function resendInvite(id: string) {
    setResendingId(id);
    setSuccess("");
    try {
      await apiFetch(`/api/admin/invites/${id}/resend`, { method: "POST" });
      setSuccess(t("adminConsole.inviteResent"));
    } catch {
      setSuccess("");
    } finally {
      setResendingId(null);
    }
  }

  return (
    <>
      <AdminHeader title={t("adminConsole.pendingInvitations")} />
      <AdminPageContainer>        {success && (
          <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-4">
            {success}
          </p>
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : invites.length === 0 ? (
          <p className="text-muted-foreground">{t("adminConsole.noPendingInvites")}</p>
        ) : (
          <TableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>{t("admin.role")}</TableHead>
                  <TableHead>{t("adminConsole.route")}</TableHead>
                  <TableHead>{t("adminConsole.owner")}</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell><Badge variant="secondary">{inv.role}</Badge></TableCell>
                    <TableCell>{inv.move.origin} → {inv.move.destination}</TableCell>
                    <TableCell>{inv.move.user.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={resendingId === inv.id}
                          onClick={() => void resendInvite(inv.id)}
                        >
                          {resendingId === inv.id ? t("common.loading") : t("adminConsole.resendInvite")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            await apiFetch(`/api/admin/invites/${inv.id}`, { method: "DELETE" });
                            await load();
                          }}
                        >
                          {t("adminConsole.revokeInvite")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroll>
        )}
      </AdminPageContainer>
    </>
  );
}
