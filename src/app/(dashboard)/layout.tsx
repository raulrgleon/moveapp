import { AIAssistantPanel } from "@/components/layout/ai-assistant-panel";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardAuthGuard } from "@/components/auth/dashboard-auth-guard";
import { MoveSetupGuard } from "@/components/auth/move-setup-guard";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { SystemAnnouncementBanner } from "@/components/layout/system-announcement-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <MoveSetupGuard>
      <div className="flex h-[100dvh] overflow-hidden bg-background flex-col">
        <SystemAnnouncementBanner />
        <ImpersonationBanner />
        <div className="flex flex-1 overflow-hidden min-h-0">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <div className="flex flex-1 overflow-hidden min-w-0">
              <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
                {children}
              </main>
              <AIAssistantPanel />
            </div>
            <MobileBottomNav />
          </div>
        </div>
      </div>
      </MoveSetupGuard>
    </DashboardAuthGuard>
  );
}
