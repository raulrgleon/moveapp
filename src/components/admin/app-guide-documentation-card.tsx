"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";

type GuideMeta = {
  updatedAt: string;
  gitCommit: string | null;
  appUrl: string | null;
  byteSize: number;
};

export function AppGuideDocumentationCard() {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<GuideMeta | null>(null);
  const [preview, setPreview] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState("");
  const [exists, setExists] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await apiFetch("/api/admin/maintenance/app-guide");
      if (res.status === 404) {
        setExists(false);
        setPreview("");
        setMeta(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as {
        preview: string;
        truncated: boolean;
        meta: GuideMeta;
      };
      setExists(true);
      setPreview(data.preview);
      setTruncated(data.truncated);
      setMeta(data.meta);
    } catch {
      setError(t("adminConsole.appGuideLoadError"));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const regenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/maintenance/app-guide", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        preview: string;
        truncated: boolean;
        meta: GuideMeta;
      };
      setExists(true);
      setPreview(data.preview);
      setTruncated(data.truncated);
      setMeta(data.meta);
    } catch {
      setError(t("adminConsole.appGuideUpdateError"));
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    try {
      const res = await fetch("/api/admin/maintenance/app-guide?download=1", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "app-guide.generated.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("adminConsole.appGuideLoadError"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{t("adminConsole.appGuideTitle")}</CardTitle>
            <CardDescription>{t("adminConsole.appGuideDesc")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {meta && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">
              {t("adminConsole.appGuideUpdated")}:{" "}
              {new Date(meta.updatedAt).toLocaleString()}
            </Badge>
            {meta.gitCommit && <Badge variant="secondary">git {meta.gitCommit}</Badge>}
            <Badge variant="outline">{(meta.byteSize / 1024).toFixed(1)} KB</Badge>
          </div>
        )}

        {!exists && !loading && (
          <p className="text-sm text-muted-foreground">{t("adminConsole.appGuideEmpty")}</p>
        )}

        {preview && (
          <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 text-xs whitespace-pre-wrap font-mono leading-relaxed">
            {preview}
            {truncated && `\n\n… ${t("adminConsole.appGuideTruncated")}`}
          </pre>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={() => void regenerate()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("adminConsole.appGuideUpdate")}
          </Button>
          <Button variant="outline" disabled={!exists || loading} onClick={() => void download()}>
            <Download className="mr-2 h-4 w-4" />
            {t("adminConsole.appGuideDownload")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{t("adminConsole.appGuideHint")}</p>
      </CardContent>
    </Card>
  );
}
