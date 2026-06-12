"use client";

import { useRef, useState } from "react";
import { Download, FileLock, Trash2, Upload, Eye } from "lucide-react";
import { useDocuments } from "@/contexts/documents-context";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { DocumentStatusBadge } from "@/components/dashboard/status-badge";
import { DOCUMENT_CATEGORY_KEYS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DocumentsPage() {
  const t = useT();
  const { canEdit } = useMove();
  const { documents, uploadDocument, deleteDocument } = useDocuments();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState("");
  const [category, setCategory] = useState("other");
  const [expiresAt, setExpiresAt] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    name: string;
    mimeType?: string;
  } | null>(null);

  const categoryLabel = (key: string) => {
    const labelKey = `documentCategories.${key}`;
    const translated = t(labelKey);
    return translated === labelKey ? key : translated;
  };

  const categories = Array.from(
    new Set([
      ...DOCUMENT_CATEGORY_KEYS.map((k) => categoryLabel(k)),
      ...documents.map((d) => d.category),
    ])
  );

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
      await uploadDocument(
        selected,
        docName || selected.name,
        categoryLabel(category),
        expiresAt || undefined
      );
      setDocName("");
      setExpiresAt("");
      setUploaded(true);
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => setUploaded(false), 2500);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("documentsPage.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const grouped = categories.map((cat) => ({
    cat,
    docs: documents.filter((d) => d.category === cat),
  })).filter((g) => g.docs.length > 0);

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
            <CardContent className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>{t("documentsPage.docName")}</Label>
                <Input value={docName} onChange={(e) => setDocName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("documentsPage.category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORY_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {categoryLabel(key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("documentsPage.expiresAt")}</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
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

        {grouped.map(({ cat, docs }) => (
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
                    {doc.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        {t("documentsPage.expiresAt")}: {doc.expiresAt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.hasFile && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPreviewDoc({
                              id: doc.id,
                              name: doc.name,
                              mimeType: doc.mimeType,
                            })
                          }
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          {t("documentsPage.preview")}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/api/documents/${doc.id}/file`} target="_blank" rel="noreferrer">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            {t("documentsPage.download")}
                          </a>
                        </Button>
                      </>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm(t("documentsPage.deleteConfirm"))) {
                            void deleteDocument(doc.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {t("documentsPage.delete")}
                      </Button>
                    )}
                    <Badge variant="outline">{doc.category}</Badge>
                    <DocumentStatusBadge status={doc.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </PageContainer>

      <Dialog open={previewDoc !== null} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="flex-1 min-h-0 overflow-auto">
              {previewDoc.mimeType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/documents/${previewDoc.id}/file`}
                  alt={previewDoc.name}
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <iframe
                  title={previewDoc.name}
                  src={`/api/documents/${previewDoc.id}/file`}
                  className="w-full h-[70vh] rounded border"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
