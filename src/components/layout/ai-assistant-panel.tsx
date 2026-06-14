"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";
import {
  ChatInputBar,
  ChatMessages,
  ChatScrollArea,
  QuickQuestions,
} from "@/components/ai/chat-ui";
import { PilotBadge } from "@/components/brand/pilot-badge";
import { PilotAvatar } from "@/components/pilot/pilot-avatar";
import { useAiChat, useAiQuickQuestions } from "@/contexts/ai-chat-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function AIAssistantPanel() {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage } = useAiChat();
  const quickQuestions = useAiQuickQuestions();

  const onAssistantPage = pathname === "/assistant";

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const handleQuick = async (question: string) => {
    await sendMessage(question);
  };

  const scrollDeps = [messages, isLoading];

  const panelBody = (
    <>
      <ChatScrollArea autoScrollDeps={scrollDeps}>
        <ChatMessages messages={messages} isLoading={isLoading} compact />
      </ChatScrollArea>
      <div className="border-t p-4 space-y-3 shrink-0 bg-muted/20">
        <QuickQuestions
          questions={quickQuestions}
          onSelect={handleQuick}
          isLoading={isLoading}
        />
        <ChatInputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isLoading={isLoading}
          compact
        />
      </div>
    </>
  );

  if (onAssistantPage) {
    return null;
  }

  return (
    <>
      <aside className="hidden xl:flex xl:w-80 xl:flex-col xl:border-l xl:bg-card shrink-0">
        <div className="border-b p-4 shrink-0 bg-gradient-to-r from-brand-accent-soft/50 to-transparent">
          <div className="flex items-center gap-3">
            <PilotAvatar thinking={isLoading} size="md" />
            <PilotBadge
              title={t("brand.pilotName")}
              subtitle={t("aiPanel.subtitle")}
              size="sm"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col min-h-0">{panelBody}</div>
      </aside>

      <div className="xl:hidden">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg shadow-primary/40 brand-cta-gradient hover:opacity-90 animate-float mobile-nav-offset lg:bottom-6"
          size="icon"
        >
          <Bot className="h-6 w-6" />
          <span className="sr-only">{t("aiPanel.open")}</span>
        </Button>

        <Sheet
          open={open}
          onOpenChange={(next) => {
            if (isLoading && !next) return;
            setOpen(next);
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="border-b p-4 shrink-0 bg-gradient-to-r from-brand-accent-soft/50 to-transparent">
              <SheetTitle asChild>
                <PilotBadge
                  title={t("brand.pilotName")}
                  subtitle={t("aiPanel.subtitle")}
                  size="sm"
                />
              </SheetTitle>
            </SheetHeader>
            {panelBody}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
