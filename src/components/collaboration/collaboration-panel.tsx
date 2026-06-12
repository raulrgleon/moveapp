"use client";

import { useState } from "react";
import { Mail, Trash2, UserPlus, Users } from "lucide-react";
import { TeamMemberAvatar } from "@/components/collaboration/team-member-avatar";
import { useMoveTeam, type CollaboratorMember } from "@/hooks/use-move-team";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CollaborationPanelProps {
  variant?: "full" | "embedded";
  onChanged?: () => void;
}

export function CollaborationPanel({ variant = "full", onChanged }: CollaborationPanelProps) {
  const t = useT();
  const { team, loading, refresh } = useMoveTeam();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [error, setError] = useState("");
  const [resentId, setResentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const notifyChange = async () => {
    await refresh();
    onChanged?.();
  };

  const invite = async () => {
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/move/collaborators", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      setInviteEmail("");
      await notifyChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.inviteError"));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/move/collaborators?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await notifyChange();
  };

  const updateRole = async (id: string, role: "editor" | "viewer") => {
    await apiFetch("/api/move/collaborators", {
      method: "PATCH",
      body: JSON.stringify({ id, role }),
    });
    await notifyChange();
  };

  const resend = async (id: string) => {
    await apiFetch(`/api/move/collaborators/${id}/resend`, { method: "POST" });
    setResentId(id);
    setTimeout(() => setResentId(null), 2500);
  };

  const roleLabel = (role: string) => {
    if (role === "owner") return t("collaboration.roleOwner");
    if (role === "viewer") return t("settings.roleViewer");
    return t("settings.roleEditor");
  };

  const renderMember = (
    key: string,
    name: string,
    email: string,
    role: string,
    accepted: boolean,
    collab?: CollaboratorMember
  ) => (
    <li
      key={key}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 bg-card"
    >
      <div className="flex items-center gap-3 min-w-0">
        <TeamMemberAvatar name={name || email} />
        <div className="min-w-0">
          <p className="font-medium truncate">{name || email}</p>
          <p className="text-sm text-muted-foreground truncate">{email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {team.canManage && collab ? (
          <Select
            value={collab.role === "viewer" ? "viewer" : "editor"}
            onValueChange={(v) => updateRole(collab.id, v as "editor" | "viewer")}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">{t("settings.roleEditor")}</SelectItem>
              <SelectItem value="viewer">{t("settings.roleViewer")}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline">{roleLabel(role)}</Badge>
        )}
        {!accepted && (
          <Badge variant="secondary">{t("settings.invitePending")}</Badge>
        )}
        {team.canManage && collab && !collab.acceptedAt && (
          <Button variant="outline" size="sm" onClick={() => resend(collab.id)}>
            <Mail className="h-4 w-4 mr-1" />
            {resentId === collab.id ? t("settings.inviteResent") : t("settings.resendInvite")}
          </Button>
        )}
        {team.canManage && collab && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove(collab.id)}
            aria-label={t("settings.removeInvite")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </li>
  );

  const content = (
    <div className="space-y-6">
      {variant === "full" && (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-2">
          <p className="font-medium">{t("collaboration.whoCanJoin")}</p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>{t("collaboration.hintSpouse")}</li>
            <li>{t("collaboration.hintRoommate")}</li>
            <li>{t("collaboration.hintFamily")}</li>
          </ul>
        </div>
      )}

      {team.canManage && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder={t("settings.inviteEmailPlaceholder")}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && inviteEmail.trim()) void invite();
              }}
            />
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "editor" | "viewer")}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue aria-label={t("settings.inviteRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">{t("settings.roleEditor")}</SelectItem>
                <SelectItem value="viewer">{t("settings.roleViewer")}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={invite} disabled={submitting || !inviteEmail.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t("settings.invite")}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
            <p>{t("collaboration.editorDesc")}</p>
            <p>{t("collaboration.viewerDesc")}</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <ul className="space-y-3">
          {team.owner &&
            renderMember(
              "owner",
              team.owner.name,
              team.owner.email,
              "owner",
              true
            )}
          {team.collaborators.map((c) =>
            renderMember(
              c.id,
              c.user?.name ?? c.email,
              c.email,
              c.role,
              Boolean(c.acceptedAt),
              c
            )
          )}
        </ul>
      )}
    </div>
  );

  if (variant === "embedded") {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t("collaboration.title")}
        </CardTitle>
        <CardDescription>{t("collaboration.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
