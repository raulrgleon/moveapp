"use client";

import { AiChatProvider } from "@/contexts/ai-chat-context";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ChecklistProvider } from "@/contexts/checklist-context";
import { DocumentsProvider } from "@/contexts/documents-context";
import { InventoryProvider } from "@/contexts/inventory-context";
import { LocaleProvider } from "@/contexts/locale-context";
import { MoveProvider } from "@/contexts/move-context";
import { MovingPlanProvider } from "@/contexts/moving-plan-context";
import { FloatingPilotLauncher } from "@/components/marketing/floating-pilot-launcher";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LocaleProvider>
          <MoveProvider>
          <InventoryProvider>
            <ChecklistProvider>
              <DocumentsProvider>
                <MovingPlanProvider>
                  <AiChatProvider>
                    {children}
                    <FloatingPilotLauncher />
                  </AiChatProvider>
                </MovingPlanProvider>
              </DocumentsProvider>
            </ChecklistProvider>
          </InventoryProvider>
        </MoveProvider>
        </LocaleProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
