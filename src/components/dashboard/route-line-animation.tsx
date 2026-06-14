"use client";

import { cn } from "@/lib/utils";

interface RouteLineAnimationProps {
  className?: string;
  animate?: boolean;
}

/** Animated origin → destination route line for hero cards. */
export function RouteLineAnimation({ className, animate = true }: RouteLineAnimationProps) {
  return (
    <svg
      viewBox="0 0 320 80"
      className={cn("w-full h-16 text-primary", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="56" r="8" className="fill-primary/20 stroke-primary stroke-2" />
      <circle cx="24" cy="56" r="3" className="fill-primary animate-pulse-glow" />
      <path
        d="M 32 52 Q 120 8, 200 28 T 288 24"
        fill="none"
        stroke="url(#routeGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        className={animate ? "route-draw" : undefined}
      />
      <circle cx="288" cy="24" r="8" className="fill-primary/20 stroke-primary stroke-2" />
      <circle cx="288" cy="24" r="3" className="fill-primary" />
      {animate && (
        <circle r="4" className="fill-amber-400 route-dot">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 32 52 Q 120 8, 200 28 T 288 24" />
        </circle>
      )}
    </svg>
  );
}
