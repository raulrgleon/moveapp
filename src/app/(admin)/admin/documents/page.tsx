"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { TableScroll } from "@/components/dashboard/table-scroll";
import { Button } from "@/components/ui/button";
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

interface DocRow {
  id: string;
  name: string;
  fileName: string | null;
  sizeBytes: number | null;
  move: { user: { name: string; email: string }; origin: string; destination: string };
}

function formatBytes(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminDocumentsPage() {
  const t = useT();
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/documents");
      const data = (await res.json()) as { documents: DocRow[]; totalBytes: number };
      setDocuments(data.documents);
      setTotalBytes(data.totalBytes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <AdminHeader
        title={t("adminConsole.documents")}
        description={`${t("adminConsole.storageUsed")}: ${formatBytes(totalBytes)}`}
      />
      <AdminPageContainer>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground">{t("adminConsole.noDocuments")}</p>
        ) : (
          <TableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>{t("adminConsole.owner")}</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.fileName ?? doc.name}</TableCell>
                    <TableCell>
                      <p>{doc.move.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.move.origin} → {doc.move.destination}
                      </p>
                    </TableCell>
                    <TableCell>{formatBytes(doc.sizeBytes)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          await apiFetch(`/api/admin/documents/${doc.id}`, { method: "DELETE" });
                          await load();
                        }}
                      >
                        {t("adminConsole.deleteDocument")}
                      </Button>
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
