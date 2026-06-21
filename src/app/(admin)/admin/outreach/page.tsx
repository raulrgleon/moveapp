"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckSquare,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Smartphone,
  Users,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale, useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { buildTemplatePreview, type CampaignTemplateId } from "@/lib/admin/campaign-templates";

type OutreachUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  locale: string | null;
  planTier: string;
  suspended: boolean;
  hasPhone: boolean;
  emailReminders: boolean;
  smsReminders: boolean;
};

type TemplateMeta = {
  id: CampaignTemplateId;
  category: "promotion" | "reminder";
  labelEn: string;
  labelEs: string;
  defaultChannel: "sms" | "email" | "both";
};

type NotificationConfig = {
  ready: boolean;
  email: { configured: boolean };
  sms: {
    configured: boolean;
    phone: string | null;
    trialAccount?: boolean | null;
    accountType?: string | null;
  };
};

type SendResult = {
  ok: boolean;
  sentEmail: number;
  sentSms: number;
  failedEmail: number;
  failedSms: number;
  skippedNoEmail: number;
  skippedNoPhone: number;
  skippedNoEmailOptIn?: number;
  skippedNoSmsOptIn?: number;
  totalRecipients: number;
  errors: string[];
};

export default function AdminOutreachPage() {
  const t = useT();
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<OutreachUser[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [channel, setChannel] = useState<"sms" | "email" | "both">("email");
  const [templateId, setTemplateId] = useState<CampaignTemplateId>("promo_pro");
  const [recipientMode, setRecipientMode] = useState<"all" | "selected">("all");
  const [filter, setFilter] = useState<"all_clients" | "trial" | "pro">("all_clients");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/outreach");
      const data = (await res.json()) as {
        users: OutreachUser[];
        templates: TemplateMeta[];
        config: NotificationConfig;
      };
      setUsers(data.users.filter((u) => !u.suspended));
      setTemplates(data.templates);
      setConfig(data.config);
    } catch {
      setError(t("adminConsole.outreachLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const template = templates.find((tpl) => tpl.id === templateId);
    if (template) setChannel(template.defaultChannel);
  }, [templateId, templates]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users;
    if (recipientMode === "all") {
      if (filter === "trial") list = list.filter((u) => u.planTier === "trial");
      if (filter === "pro") list = list.filter((u) => u.planTier === "pro");
    }
    if (!q) return list;
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").includes(q)
    );
  }, [users, search, recipientMode, filter]);

  const effectiveRecipients = useMemo(() => {
    if (recipientMode === "selected") {
      return users.filter((u) => selectedIds.has(u.id));
    }
    if (filter === "trial") return users.filter((u) => u.planTier === "trial");
    if (filter === "pro") return users.filter((u) => u.planTier === "pro");
    return users;
  }, [users, recipientMode, selectedIds, filter]);

  const previewUser = effectiveRecipients[0] ?? users[0];
  const preview = previewUser
    ? buildTemplatePreview(
        templateId,
        previewUser.locale === "es" ? "es" : "en",
        previewUser.name,
        { subject: customSubject, body: customBody }
      )
    : { subject: "", html: "", sms: "" };

  const canSendEmail = config?.email.configured && (channel === "email" || channel === "both");
  const canSendSms = config?.sms.configured && (channel === "sms" || channel === "both");

  const eligibleEmail = effectiveRecipients.filter((u) => u.emailReminders && u.email).length;
  const eligibleSms = effectiveRecipients.filter(
    (u) => u.smsReminders && u.hasPhone
  ).length;

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleSend() {
    setSending(true);
    setError("");
    setResult(null);
    try {
      const res = await apiFetch("/api/admin/outreach/send", {
        method: "POST",
        body: JSON.stringify({
          channel,
          templateId,
          recipientMode,
          userIds: recipientMode === "selected" ? Array.from(selectedIds) : undefined,
          filter: recipientMode === "all" ? filter : undefined,
          customSubject: templateId === "custom" ? customSubject : undefined,
          customBody: templateId === "custom" ? customBody : undefined,
        }),
      });
      const data = (await res.json()) as SendResult;
      setResult(data);
      if (!data.ok && data.errors?.length) {
        setError(data.errors.join("; "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("adminConsole.outreachSendError"));
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  }

  const templateLabel = (tpl: TemplateMeta) => (locale === "es" ? tpl.labelEs : tpl.labelEn);

  return (
    <>
      <AdminHeader
        title={t("adminConsole.outreach")}
        description={t("adminConsole.outreachDesc")}
      />
      <AdminPageContainer className="max-w-4xl space-y-6">
        {config && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={config.email.configured ? "default" : "secondary"}>
              <Mail className="mr-1 h-3 w-3" />
              {config.email.configured
                ? t("adminConsole.outreachEmailReady")
                : t("adminConsole.outreachEmailMissing")}
            </Badge>
            <Badge variant={config.sms.configured ? "default" : "secondary"}>
              <Smartphone className="mr-1 h-3 w-3" />
              {config.sms.configured
                ? t("adminConsole.outreachSmsReady")
                : t("adminConsole.outreachSmsMissing")}
            </Badge>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" />
              {t("adminConsole.outreachChannel")}
            </CardTitle>
            <CardDescription>{t("adminConsole.outreachChannelDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(["email", "sms", "both"] as const).map((c) => (
              <Button
                key={c}
                type="button"
                variant={channel === c ? "default" : "outline"}
                onClick={() => setChannel(c)}
              >
                {c === "email" && <Mail className="mr-2 h-4 w-4" />}
                {c === "sms" && <Smartphone className="mr-2 h-4 w-4" />}
                {c === "both" && <MessageSquare className="mr-2 h-4 w-4" />}
                {t(`adminConsole.outreachChannel_${c}`)}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminConsole.outreachMessage")}</CardTitle>
            <CardDescription>{t("adminConsole.outreachMessageDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("adminConsole.outreachTemplate")}</Label>
              <Select
                value={templateId}
                onValueChange={(v) => setTemplateId(v as CampaignTemplateId)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {templateLabel(tpl)}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">{t("adminConsole.outreachCustom")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {templateId === "custom" ? (
              <div className="space-y-3">
                {(channel === "email" || channel === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-subject">{t("adminConsole.outreachSubject")}</Label>
                    <Input
                      id="custom-subject"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder={t("adminConsole.outreachSubjectPlaceholder")}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="custom-body">{t("adminConsole.outreachBody")}</Label>
                  <Textarea
                    id="custom-body"
                    rows={6}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    placeholder={t("adminConsole.outreachBodyPlaceholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("adminConsole.outreachNameHint")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                {(channel === "email" || channel === "both") && (
                  <p>
                    <span className="font-medium">{t("adminConsole.outreachSubject")}:</span>{" "}
                    {preview.subject}
                  </p>
                )}
                {(channel === "email" || channel === "both") && (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: preview.html }}
                  />
                )}
                {(channel === "sms" || channel === "both") && (
                  <p className="font-mono text-xs whitespace-pre-wrap border-t pt-2 mt-2">
                    {preview.sms}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("adminConsole.outreachRecipients")}
            </CardTitle>
            <CardDescription>{t("adminConsole.outreachRecipientsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={recipientMode === "all" ? "default" : "outline"}
                onClick={() => setRecipientMode("all")}
              >
                {t("adminConsole.outreachAllUsers")}
              </Button>
              <Button
                type="button"
                variant={recipientMode === "selected" ? "default" : "outline"}
                onClick={() => setRecipientMode("selected")}
              >
                {t("adminConsole.outreachSelectUsers")}
              </Button>
            </div>

            {recipientMode === "all" && (
              <div className="space-y-2">
                <Label>{t("adminConsole.outreachFilter")}</Label>
                <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_clients">{t("adminConsole.outreachFilterAll")}</SelectItem>
                    <SelectItem value="trial">{t("adminConsole.outreachFilterTrial")}</SelectItem>
                    <SelectItem value="pro">{t("adminConsole.outreachFilterPro")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {recipientMode === "selected" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    placeholder={t("adminConsole.outreachSearch")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={selectAllVisible}>
                    <CheckSquare className="mr-1 h-3 w-3" />
                    {t("adminConsole.outreachSelectAll")}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                    {t("adminConsole.outreachClearSelection")}
                  </Button>
                  <Badge variant="secondary">
                    {selectedIds.size} {t("adminConsole.outreachSelected")}
                  </Badge>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
                  {loading ? (
                    <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("adminConsole.outreachLoading")}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-start gap-3 p-3 hover:bg-muted/40 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => toggleUser(user.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px]">
                              {user.planTier}
                            </Badge>
                            {user.hasPhone ? (
                              <Badge variant="outline" className="text-[10px]">
                                SMS
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                {t("adminConsole.outreachNoPhone")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border p-3 text-sm space-y-1 bg-muted/20">
              <p>
                {t("adminConsole.outreachSummary")}:{" "}
                <strong>{effectiveRecipients.length}</strong> {t("adminConsole.outreachUsers")}
              </p>
              {(channel === "email" || channel === "both") && (
                <p className="text-muted-foreground">
                  {t("adminConsole.outreachEligibleEmail")}: {eligibleEmail}
                </p>
              )}
              {(channel === "sms" || channel === "both") && (
                <p className="text-muted-foreground">
                  {t("adminConsole.outreachEligibleSms")}: {eligibleSms}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {config?.sms.trialAccount && (channel === "sms" || channel === "both") && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-1">
              <p className="font-medium">{t("adminConsole.outreachTwilioTrialTitle")}</p>
              <p className="text-muted-foreground">{t("adminConsole.outreachTwilioTrialDesc")}</p>
              <a
                href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs"
              >
                {t("adminConsole.outreachTwilioVerifyLink")}
              </a>
            </div>
          </div>
        )}

        {(!canSendEmail && (channel === "email" || channel === "both")) ||
        (!canSendSms && (channel === "sms" || channel === "both")) ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <p>{t("adminConsole.outreachConfigWarning")}</p>
          </div>
        ) : null}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("adminConsole.outreachResult")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {(channel === "email" || channel === "both") && (
                <p>
                  Email: {result.sentEmail} {t("adminConsole.outreachSent")},{" "}
                  {result.failedEmail} {t("adminConsole.outreachFailed")},{" "}
                  {result.skippedNoEmail} {t("adminConsole.outreachSkipped")}
                  {(result.skippedNoEmailOptIn ?? 0) > 0 &&
                    `, ${result.skippedNoEmailOptIn} ${t("adminConsole.outreachSkippedOptIn")}`}
                </p>
              )}
              {(channel === "sms" || channel === "both") && (
                <p>
                  SMS: {result.sentSms} {t("adminConsole.outreachSent")},{" "}
                  {result.failedSms} {t("adminConsole.outreachFailed")},{" "}
                  {result.skippedNoPhone} {t("adminConsole.outreachSkipped")}
                  {(result.skippedNoSmsOptIn ?? 0) > 0 &&
                    `, ${result.skippedNoSmsOptIn} ${t("adminConsole.outreachSkippedOptIn")}`}
                </p>
              )}
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-destructive list-disc pl-4">
                  {result.errors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Button
          size="lg"
          disabled={
            sending ||
            loading ||
            effectiveRecipients.length === 0 ||
            (recipientMode === "selected" && selectedIds.size === 0) ||
            (templateId === "custom" && !customBody.trim()) ||
            (!canSendEmail && (channel === "email" || channel === "both")) ||
            (!canSendSms && (channel === "sms" || channel === "both"))
          }
          onClick={() => setConfirmOpen(true)}
        >
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {t("adminConsole.outreachSend")}
        </Button>
      </AdminPageContainer>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminConsole.outreachConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("adminConsole.outreachConfirmDesc", {
                count: String(effectiveRecipients.length),
                channel: t(`adminConsole.outreachChannel_${channel}`),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("adminConsole.outreachCancel")}
            </Button>
            <Button disabled={sending} onClick={() => void handleSend()}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("adminConsole.outreachConfirmSend")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
