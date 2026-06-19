"use client";

import { useEffect, useState } from "react";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Providers = { google: boolean; apple: boolean };

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05 1.88-3.3 1.88-1.22 0-1.62-.73-3.03-.73-1.41 0-1.85.71-3.01.73-1.21.02-2.13-1.01-3.11-1.96C2.79 17.25 1.94 12.45 4.7 9.73c1.38-1.35 3.51-2.39 5.66-2.2 1.4.11 2.43.76 3.03.76.6 0 1.73-.94 2.92-.8.5.02 1.9.2 2.8 1.48-2.4 1.26-2.01 4.54.39 5.51-.47 1.24-.72 1.79-1.35 2.89zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function OAuthButtons({ showSeparator = true }: { showSeparator?: boolean }) {
  const t = useT();
  const [providers, setProviders] = useState<Providers | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => (res.ok ? res.json() : { google: false, apple: false }))
      .then((data) => setProviders(data as Providers))
      .catch(() => setProviders({ google: false, apple: false }));
  }, []);

  if (!providers || (!providers.google && !providers.apple)) {
    return null;
  }

  return (
    <>
      {showSeparator && (
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            {t("common.or")}
          </span>
        </div>
      )}
      <div className="space-y-2">
        {providers.google && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href="/api/auth/google">
              <GoogleIcon className="h-4 w-4" />
              {t("login.google")}
            </a>
          </Button>
        )}
        {providers.apple && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href="/api/auth/apple">
              <AppleIcon className="h-4 w-4" />
              {t("login.apple")}
            </a>
          </Button>
        )}
      </div>
    </>
  );
}
