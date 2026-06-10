import { AIAssistantPanel } from "@/components/layout/ai-assistant-panel";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
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
  );
}
