"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export interface CollaboratorMember {
  id: string;
  email: string;
  role: string;
  acceptedAt: string | null;
  user?: { name: string; email: string } | null;
}

export interface MoveTeam {
  owner: { name: string; email: string; role: string } | null;
  collaborators: CollaboratorMember[];
  canManage: boolean;
}

export function useMoveTeam() {
  const [team, setTeam] = useState<MoveTeam>({
    owner: null,
    collaborators: [],
    canManage: false,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch("/api/move/collaborators");
      const data = (await res.json()) as MoveTeam;
      setTeam(data);
    } catch {
      setTeam({ owner: null, collaborators: [], canManage: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const assigneeOptions = [
    ...(team.owner
      ? [{ email: team.owner.email, name: team.owner.name, role: "owner" as const }]
      : []),
    ...team.collaborators
      .filter((c) => c.acceptedAt)
      .map((c) => ({
        email: c.user?.email ?? c.email,
        name: c.user?.name ?? c.email,
        role: c.role as "editor" | "viewer",
      })),
  ];

  const acceptedCount =
    1 +
    team.collaborators.filter((c) => c.acceptedAt).length;

  const pendingCount = team.collaborators.filter((c) => !c.acceptedAt).length;

  return {
    team,
    loading,
    refresh,
    assigneeOptions,
    acceptedCount,
    pendingCount,
  };
}
