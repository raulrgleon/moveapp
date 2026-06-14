"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "segmented";
}

export function ThemeToggle({ className, variant = "segmented" }: ThemeToggleProps) {
  const t = useT();
  const { theme, setTheme, resolved } = useTheme();

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={className}
        onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
        aria-label={t("settings.themeToggle")}
      >
        {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <div className={cn("flex gap-2", className)}>
      {(["light", "dark", "system"] as const).map((opt) => (
        <Button
          key={opt}
          type="button"
          variant={theme === opt ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme(opt)}
        >
          {t(`settings.theme${opt.charAt(0).toUpperCase()}${opt.slice(1)}`)}
        </Button>
      ))}
    </div>
  );
}
