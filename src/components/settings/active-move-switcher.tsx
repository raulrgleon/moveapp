"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { invalidateUserData } from "@/lib/data-cache";
import { MOVE_PROFILE_UPDATED } from "@/lib/move/profile-events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MoveOption {
  id: string;
  origin: string;
  destination: string;
  moveDate: string;
  role: "owner" | "editor" | "viewer";
  ownerName: string | null;
  isActive: boolean;
}

export function ActiveMoveSwitcher() {
  const t = useT();
  const { user } = useAuth();
  const router = useRouter();
  const [moves, setMoves] = useState<MoveOption[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await apiFetch("/api/user/moves");
        const data = (await res.json()) as { moves: MoveOption[]; activeMoveId: string | null };
        setMoves(data.moves);
        const current = data.moves.find((m) => m.isActive)?.id ?? data.moves[0]?.id ?? "";
        setActiveId(current);
      } catch {
        setMoves([]);
      }
    })();
  }, [user]);

  if (moves.length <= 1) return null;

  const switchMove = async (moveId: string) => {
    if (moveId === activeId) return;
    setLoading(true);
    try {
      await apiFetch("/api/user/active-move", {
        method: "PATCH",
        body: JSON.stringify({ moveId }),
      });
      setActiveId(moveId);
      invalidateUserData();
      window.dispatchEvent(new Event(MOVE_PROFILE_UPDATED));
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const labelFor = (m: MoveOption) => {
    const route = `${m.origin} → ${m.destination}`;
    if (m.role === "owner") return route;
    return `${route} (${m.ownerName ?? m.role})`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("settings.activeMove")}</CardTitle>
        <CardDescription>{t("settings.activeMoveDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label>{t("settings.switchMove")}</Label>
        <Select value={activeId} onValueChange={switchMove} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder={t("settings.switchMove")} />
          </SelectTrigger>
          <SelectContent>
            {moves.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {labelFor(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading && (
          <p className="text-xs text-muted-foreground">{t("settings.switchingMove")}</p>
        )}
      </CardContent>
    </Card>
  );
}
