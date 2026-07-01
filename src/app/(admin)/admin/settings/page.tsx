"use client";

import { useEffect, useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";

interface AnnouncementRow {
  id: string;
  message: string;
  type: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

interface AmazonSettings {
  associateTag: string;
  marketplaceDomain: string;
}

export default function AdminSettingsPage() {
  const t = useT();
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [success, setSuccess] = useState("");
  const [amazonSaving, setAmazonSaving] = useState(false);
  const [amazonSettings, setAmazonSettings] = useState<AmazonSettings>({
    associateTag: "",
    marketplaceDomain: "www.amazon.com",
  });

  async function load() {
    setLoading(true);
    try {
      const [healthRes, annRes] = await Promise.all([
        apiFetch("/api/admin/settings"),
        apiFetch("/api/admin/announcements"),
      ]);
      setHealth((await healthRes.json()) as Record<string, unknown>);
      const annData = (await annRes.json()) as { announcements: AnnouncementRow[] };
      setAnnouncements(annData.announcements);
      const amazonRes = await apiFetch("/api/admin/amazon-settings");
      const amazonData = (await amazonRes.json()) as AmazonSettings;
      setAmazonSettings({
        associateTag: amazonData.associateTag ?? "",
        marketplaceDomain: amazonData.marketplaceDomain ?? "www.amazon.com",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSaving(true);
    setSuccess("");
    try {
      await apiFetch("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ message, type, active: true }),
      });
      setMessage("");
      setSuccess(t("adminConsole.announcementCreated"));
      await load();
    } finally {
      setSaving(false);
    }
  }

  const integrations = (health?.integrations ?? {}) as Record<string, boolean>;
  const env = (health?.env ?? {}) as Record<string, { configured: boolean; preview: string | null }>;

  async function saveAmazonSettings(e: React.FormEvent) {
    e.preventDefault();
    setAmazonSaving(true);
    setSuccess("");
    try {
      await apiFetch("/api/admin/amazon-settings", {
        method: "PATCH",
        body: JSON.stringify({
          associateTag: amazonSettings.associateTag,
          marketplaceDomain: amazonSettings.marketplaceDomain,
        }),
      });
      setSuccess(t("adminConsole.amazonSettingsSaved"));
      await load();
    } finally {
      setAmazonSaving(false);
    }
  }

  return (
    <>
      <AdminHeader title={t("adminConsole.settings")} />
      <AdminPageContainer className="max-w-3xl space-y-6">
        {success && (
          <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
            {success}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminConsole.amazonAffiliateSettings")}</CardTitle>
            <CardDescription>{t("adminConsole.amazonAffiliateSettingsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={saveAmazonSettings}>
              <div className="space-y-2">
                <Label htmlFor="amazon-associate-tag">{t("adminConsole.amazonAssociateTag")}</Label>
                <Input
                  id="amazon-associate-tag"
                  value={amazonSettings.associateTag}
                  onChange={(e) =>
                    setAmazonSettings((prev) => ({ ...prev, associateTag: e.target.value.trim() }))
                  }
                  placeholder="MY_ASSOCIATE_TAG"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amazon-marketplace-domain">{t("adminConsole.amazonMarketplaceDomain")}</Label>
                <Input
                  id="amazon-marketplace-domain"
                  value={amazonSettings.marketplaceDomain}
                  onChange={(e) =>
                    setAmazonSettings((prev) => ({
                      ...prev,
                      marketplaceDomain: e.target.value.trim() || "www.amazon.com",
                    }))
                  }
                  placeholder="www.amazon.com"
                  required
                />
              </div>
              <Button type="submit" disabled={amazonSaving}>
                {amazonSaving ? t("common.saving") : t("adminConsole.saveAmazonSettings")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              {t("adminConsole.announcements")}
            </CardTitle>
            <CardDescription>{t("adminConsole.announcementsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={createAnnouncement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-message">{t("adminConsole.announcementMessage")}</Label>
                <Textarea
                  id="announcement-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("adminConsole.announcementPlaceholder")}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("adminConsole.announcementType")}</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">{t("adminConsole.typeInfo")}</SelectItem>
                    <SelectItem value="warning">{t("adminConsole.typeWarning")}</SelectItem>
                    <SelectItem value="maintenance">{t("adminConsole.typeMaintenance")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving || !message.trim()}>
                {saving ? t("common.loading") : t("adminConsole.publishAnnouncement")}
              </Button>
            </form>

            {announcements.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                {announcements.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">{item.message}</p>
                      <Badge variant={item.active ? "default" : "secondary"}>
                        {item.active ? t("admin.active") : t("adminConsole.inactive")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{item.type}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await apiFetch(`/api/admin/announcements/${item.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ active: !item.active }),
                          });
                          await load();
                        }}
                      >
                        {item.active ? t("adminConsole.deactivate") : t("adminConsole.activate")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          await apiFetch(`/api/admin/announcements/${item.id}`, { method: "DELETE" });
                          await load();
                        }}
                      >
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("adminConsole.integrations")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Object.entries(integrations).map(([key, ok]) => (
                  <Badge key={key} variant={ok ? "default" : "secondary"}>
                    {key}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("adminConsole.envStatus")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(env).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b pb-2">
                    <span className="font-mono">{key}</span>
                    <span className="text-muted-foreground">
                      {val.configured ? val.preview : t("adminConsole.missing")}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">
                  App URL: {String(health?.appUrl ?? "—")} · Node: {String(health?.nodeEnv ?? "—")}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </AdminPageContainer>
    </>
  );
}
