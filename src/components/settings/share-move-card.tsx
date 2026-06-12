"use client";

import { useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Collaborator {
  id: string;
  email: string;
  role: string;
  acceptedAt: string | null;
  user?: { name: string; email: string } | null;
}

export function ShareMoveCard() {
  const t = useT();
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await apiFetch("/api/move/collaborators");
      const data = (await res.json()) as { collaborators: Collaborator[] };
      setCollaborators(data.collaborators);
    } catch {
      setCollaborators([]);
    }
  };

  useEffect(() => {
    if (user) void load();
  }, [user]);

  const invite = async () => {
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/move/collaborators", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: "editor" }),
      });
      setInviteEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.inviteError"));
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/move/collaborators?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("settings.shareTitle")}</CardTitle>
        <CardDescription>{t("settings.shareDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={t("settings.inviteEmailPlaceholder")}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button onClick={invite} disabled={loading || !inviteEmail.trim()}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t("settings.invite")}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {collaborators.length > 0 && (
          <ul className="space-y-2">
            {collaborators.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{c.user?.name ?? c.email}</p>
                  <p className="text-muted-foreground">{c.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{c.role}</Badge>
                  <Badge variant={c.acceptedAt ? "success" : "secondary"}>
                    {c.acceptedAt ? t("settings.inviteAccepted") : t("settings.invitePending")}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)} aria-label={t("settings.removeInvite")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
