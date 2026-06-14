"use client";

import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

interface MoveScoreRingProps {
  score: number;
  size?: number;
  className?: string;
}

export function MoveScoreRing({ score, size = 96, className }: MoveScoreRingProps) {
  const t = useT();
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/80"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--brand-blue))" />
            <stop offset="100%" stopColor="hsl(var(--brand-accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-label={t("gamification.moveScore", { score })}
      >
        <span className="text-2xl font-bold tabular-nums">{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          {t("gamification.scoreLabel")}
        </span>
      </div>
    </div>
  );
}
