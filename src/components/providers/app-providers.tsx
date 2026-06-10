"use client";

import { InventoryProvider } from "@/contexts/inventory-context";
import { LocaleProvider } from "@/contexts/locale-context";
import { MoveProvider } from "@/contexts/move-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <MoveProvider>
        <InventoryProvider>{children}</InventoryProvider>
      </MoveProvider>
    </LocaleProvider>
  );
}
