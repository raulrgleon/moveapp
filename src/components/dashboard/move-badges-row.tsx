"use client";

import type { MoveBadge } from "@/lib/gamification/move-score";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import { Award } from "lucide-react";

interface MoveBadgesRowProps {
  badges: MoveBadge[];
  className?: string;
}

export function MoveBadgesRow({ badges, className }: MoveBadgesRowProps) {
  const t = useT();
  const earned = badges.filter((b) => b.earned);

  if (earned.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {earned.map((badge) => (
        <span
          key={badge.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary animate-fade-in"
        >
          <Award className="h-3 w-3" />
          {t(badge.labelKey)}
        </span>
      ))}
    </div>
  );
}
