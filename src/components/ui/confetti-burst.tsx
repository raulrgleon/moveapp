"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const COLORS = ["#0D9488", "#14B8A6", "#F59E0B", "#3B82F6", "#EC4899"];

interface ConfettiBurstProps {
  active: boolean;
  className?: string;
}

export function ConfettiBurst({ active, className }: ConfettiBurstProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, [active]);

  if (!show) return null;

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-[100] overflow-hidden", className)}
      aria-hidden
    >
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-1/2 left-1/2 block h-2 w-2 rounded-sm"
          style={{
            backgroundColor: COLORS[i % COLORS.length],
            animationDelay: `${(i % 10) * 40}ms`,
            ["--tx" as string]: `${(Math.random() - 0.5) * 420}px`,
            ["--ty" as string]: `${-80 - Math.random() * 320}px`,
            ["--rot" as string]: `${Math.random() * 720}deg`,
          }}
        />
      ))}
    </div>
  );
}
