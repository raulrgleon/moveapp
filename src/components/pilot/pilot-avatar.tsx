"use client";

import { cn } from "@/lib/utils";

interface PilotAvatarProps {
  thinking?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };

export function PilotAvatar({ thinking = false, size = "md", className }: PilotAvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full brand-cta-gradient text-primary-foreground font-bold shadow-md",
        sizes[size],
        thinking && "animate-pulse-glow",
        className
      )}
      aria-hidden
    >
      <span className="text-sm">P</span>
      {thinking && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
        </span>
      )}
    </div>
  );
}
