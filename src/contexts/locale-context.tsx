"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import {
  DEFAULT_LOCALE,
  detectDeviceLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
  translate,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  isHydrated: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

async function persistLocale(locale: Locale) {
  try {
    await apiFetch("/api/user/preferences", {
      method: "PATCH",
      body: JSON.stringify({ locale }),
    });
  } catch {
    /* offline or guest */
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isHydrated: authHydrated } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!authHydrated) return;

    const stored = detectDeviceLocale();
    const dbLocale = user?.locale === "es" || user?.locale === "en" ? user.locale : null;
    setLocaleState(dbLocale ?? stored);
    setIsHydrated(true);
  }, [authHydrated, user?.locale]);

  useEffect(() => {
    if (!isHydrated) return;
    document.documentElement.lang = locale;
  }, [locale, isHydrated]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
      document.documentElement.lang = next;
      if (isAuthenticated) void persistLocale(next);
    },
    [isAuthenticated]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, isHydrated, setLocale, t }),
    [locale, isHydrated, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}
