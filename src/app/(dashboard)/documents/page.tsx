"use client";

import { useRef, useState } from "react";
import { Download, FileLock, Upload } from "lucide-react";
import { useDocuments } from "@/contexts/documents-context";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { DocumentStatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DocumentsPage() {
  const t = useT();
  const { canEdit } = useMove();
  const { documents, uploadDocument } = useDocuments();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState("");
  const [category, setCategory] = useState("Other");
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const categories = Array.from(new Set(documents.map((d) => d.category)));
  const verified = documents.filter((d) => d.status === "verified").length;
  const pending = documents.filter((d) => d.status === "pending").length;
  const missing = documents.filter((d) => d.status === "missing").length;

  const handleUpload = async (file?: File) => {
    const selected = file ?? fileRef.current?.files?.[0];
    if (!selected) {
      fileRef.current?.click();
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      await uploadDocument(selected, docName || selected.name, category);
      setDocName("");
      setUploaded(true);
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => setUploaded(false), 2500);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("documentsPage.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <DashboardHeader title={t("documentsPage.title")} description={t("documentsPage.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("documentsPage.pageTitle")}
          description={t("documentsPage.pageDesc")}
          action={
            canEdit ? (
              <Button onClick={() => void handleUpload()} disabled={uploading}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? t("documentsPage.uploading") : t("documentsPage.upload")}
              </Button>
            ) : undefined
          }
        />

        {uploaded && (
          <p className="text-sm text-emerald-600 mb-4">{t("documentsPage.uploadSuccess")}</p>
        )}
        {uploadError && <p className="text-sm text-destructive mb-4">{uploadError}</p>}

        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <FileLock className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium text-sm">{t("documentsPage.encrypted")}</p>
              <p className="text-xs text-muted-foreground">{t("documentsPage.encryptedDesc")}</p>
            </div>
          </CardContent>
        </Card>

        {canEdit && (
          <Card>
            <CardContent className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("documentsPage.docName")}</Label>
                <Input value={docName} onChange={(e) => setDocName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("documentsPage.category")}</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("documentsPage.uploadPrompt")}</Label>
                <Input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(f);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{verified}</p>
              <p className="text-sm text-muted-foreground">{t("documentsPage.verified")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-sky-600">{pending}</p>
              <p className="text-sm text-muted-foreground">{t("documentsPage.pending")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{missing}</p>
              <p className="text-sm text-muted-foreground">{t("documentsPage.missing")}</p>
            </CardContent>
          </Card>
        </div>

        {categories.map((cat) => {
          const docs = documents.filter((d) => d.category === cat);
          return (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-base">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      {doc.uploadedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("documentsPage.uploaded", { date: doc.uploadedAt })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.hasFile && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/api/documents/${doc.id}/file`} target="_blank" rel="noreferrer">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            {t("documentsPage.download")}
                          </a>
                        </Button>
                      )}
                      <Badge variant="outline">{doc.category}</Badge>
                      <DocumentStatusBadge status={doc.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </PageContainer>
    </>
  );
}
