"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
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

  useEffect(() => {
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
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <>
      <AdminHeader title={t("adminConsole.moves")} />
      <PageContainer>
        <PageHeader title={t("adminConsole.moves")} />
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
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/moves/${move.id}`}>{t("adminConsole.viewDetails")}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroll>
        )}
      </PageContainer>
    </>
  );
}
