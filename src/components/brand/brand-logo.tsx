"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
  tagline?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
}

export function BrandLogo({
  className,
  showTagline = false,
  tagline,
  href = "/",
  size = "md",
  variant = "default",
}: BrandLogoProps) {
  const wordClass =
    size === "lg"
      ? "text-xl sm:text-2xl"
      : size === "sm"
        ? "text-sm"
        : "text-base";

  const content = (
    <>
      <BrandMark size={size === "lg" ? "lg" : size === "sm" ? "sm" : "md"} />
      <div className="flex flex-col min-w-0">
        <span className={cn("font-bold tracking-tight leading-none", wordClass)}>
          <span className={variant === "light" ? "text-white" : "text-foreground"}>
            MovePilot
          </span>
          <span className="brand-ai">Ai</span>
        </span>
        {showTagline && tagline && (
          <span
            className={cn(
              "text-xs mt-0.5 truncate max-w-[220px]",
              variant === "light" ? "text-white/75" : "text-muted-foreground"
            )}
          >
            {tagline}
          </span>
        )}
      </div>
    </>
  );

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity", className)}
    >
      {content}
    </Link>
  );
}
