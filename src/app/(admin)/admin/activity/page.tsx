"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableScroll } from "@/components/dashboard/table-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/contexts/locale-context";
import { useLocale } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

interface LogRow {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  admin: { name: string; email: string };
}

export default function AdminActivityPage() {
  const t = useT();
  const { locale } = useLocale();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/api/admin/audit-log?limit=100");
        const data = (await res.json()) as { logs: LogRow[] };
        setLogs(data.logs);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <>
      <AdminHeader title={t("adminConsole.activity")} />
      <PageContainer>
        <PageHeader title={t("adminConsole.auditLog")} />
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
                  <TableHead>{t("adminConsole.when")}</TableHead>
                  <TableHead>{t("adminConsole.by")}</TableHead>
                  <TableHead>{t("adminConsole.action")}</TableHead>
                  <TableHead>{t("adminConsole.target")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDate(log.createdAt, locale)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{log.admin.name}</p>
                      <p className="text-xs text-muted-foreground">{log.admin.email}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.targetType ?? "—"} {log.targetId ? log.targetId.slice(0, 8) : ""}
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
