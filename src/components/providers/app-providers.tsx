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
import { CookieConsent } from "@/components/marketing/cookie-consent";
import { FloatingPilotLauncher } from "@/components/marketing/floating-pilot-launcher";
import { DeployReloadPrompt } from "@/components/layout/deploy-reload-prompt";
import { PaywallProvider } from "@/components/billing/paywall-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LocaleProvider>
          <PaywallProvider>
          <MoveProvider>
          <InventoryProvider>
            <ChecklistProvider>
              <DocumentsProvider>
                <MovingPlanProvider>
                  <AiChatProvider>
                    {children}
                    <FloatingPilotLauncher />
                    <DeployReloadPrompt />
                    <CookieConsent />
                  </AiChatProvider>
                </MovingPlanProvider>
              </DocumentsProvider>
            </ChecklistProvider>
          </InventoryProvider>
        </MoveProvider>
          </PaywallProvider>
        </LocaleProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
