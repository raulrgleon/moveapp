"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { Input } from "@/components/ui/input";
import { TableScroll } from "@/components/dashboard/table-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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

interface MoveRow {
  id: string;
  origin: string;
  destination: string;
  moveDate: string;
  user: { id: string; name: string; email: string };
  _count: { checklistTasks: number; documents: number; collaborators: number };
}

export default function AdminMovesPage() {
  const t = useT();
  const { locale } = useLocale();
  const [moves, setMoves] = useState<MoveRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<MoveRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/moves${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = (await res.json()) as { moves: MoveRow[] };
      setMoves(data.moves);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/moves/${deleteTarget.id}`, { method: "DELETE" });
      setSuccess(t("adminConsole.moveDeleted"));
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AdminHeader title={t("adminConsole.moves")} />
      <AdminPageContainer>        {success && (
          <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-4">
            {success}
          </p>
        )}
        <Input
          placeholder={t("adminConsole.searchMoves")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md mb-4"
        />
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : (
          <TableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminConsole.owner")}</TableHead>
                  <TableHead>{t("adminConsole.route")}</TableHead>
                  <TableHead>{t("adminConsole.moveDate")}</TableHead>
                  <TableHead>Tasks / Docs</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moves.map((move) => (
                  <TableRow key={move.id}>
                    <TableCell>
                      <p className="font-medium">{move.user.name}</p>
                      <p className="text-xs text-muted-foreground">{move.user.email}</p>
                    </TableCell>
                    <TableCell>
                      {move.origin} → {move.destination}
                    </TableCell>
                    <TableCell>{formatDate(move.moveDate, locale)}</TableCell>
                    <TableCell>
                      {move._count.checklistTasks} / {move._count.documents}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/moves/${move.id}`}>{t("adminConsole.viewDetails")}</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title={t("adminConsole.deleteMove")}
                          onClick={() => setDeleteTarget(move)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminConsole.deleteMove")}</DialogTitle>
            <DialogDescription>
              {deleteTarget &&
                t("adminConsole.deleteMoveConfirm", {
                  route: `${deleteTarget.origin} → ${deleteTarget.destination}`,
                  owner: deleteTarget.user.name,
                })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? t("common.loading") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
