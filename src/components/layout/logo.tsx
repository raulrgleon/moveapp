"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
}

export function Logo({ className, showTagline = false, size = "md", variant = "default" }: LogoProps) {
  const t = useT();

  return (
    <BrandLogo
      className={cn(className)}
      showTagline={showTagline}
      tagline={t("tagline")}
      size={size}
      variant={variant}
    />
  );
}
