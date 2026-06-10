"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { useLocale, useT } from "@/contexts/locale-context";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  /** Show EN / ES codes next to the globe on larger screens */
  showLabel?: boolean;
}

export function LanguageToggle({ className, showLabel = true }: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const selectLocale = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size={showLabel ? "sm" : "icon"}
        className={cn(
          "shrink-0 gap-1.5 text-muted-foreground hover:text-foreground",
          showLabel && "h-9 px-2.5"
        )}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("common.changeLanguage")}
      >
        <Globe className="h-4 w-4 shrink-0" />
        {showLabel && (
          <span className="text-xs font-semibold uppercase tracking-wide">
            {locale}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="listbox"
          aria-label={t("common.changeLanguage")}
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[9rem] overflow-hidden rounded-lg border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {SUPPORTED_LOCALES.map(({ code }) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={locale === code}
              onClick={() => selectLocale(code)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                locale === code
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span>{t(code === "en" ? "settings.english" : "settings.spanish")}</span>
              <span className="text-xs uppercase text-muted-foreground">{code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
