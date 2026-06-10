"use client";

import { Navigation } from "lucide-react";
import Link from "next/link";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export function Logo({ className, showTagline = false }: LogoProps) {
  const t = useT();

  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Navigation className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-base font-semibold tracking-tight text-foreground">
          {t("appName")}
        </span>
        {showTagline && (
          <span className="text-xs text-muted-foreground">{t("tagline")}</span>
        )}
      </div>
    </Link>
  );
}
