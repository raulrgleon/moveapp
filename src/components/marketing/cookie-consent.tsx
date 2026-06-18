"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "movepilot_cookie_consent";

export function CookieConsent() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(CONSENT_KEY) === "1") return;
    setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6 pointer-events-none"
    >
      <div className="mx-auto max-w-3xl rounded-xl border bg-card shadow-xl p-4 sm:p-5 pointer-events-auto">
        <p className="text-sm text-muted-foreground">{t("cookies.message")}</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <Link href="/privacy" className="text-sm text-primary hover:underline">
            {t("cookies.learnMore")}
          </Link>
          <Button size="sm" onClick={accept}>
            {t("cookies.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
