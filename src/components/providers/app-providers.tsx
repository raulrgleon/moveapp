"use client";

import { LocaleProvider } from "@/contexts/locale-context";
import { MoveProvider } from "@/contexts/move-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <MoveProvider>{children}</MoveProvider>
    </LocaleProvider>
  );
}
