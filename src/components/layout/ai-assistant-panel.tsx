"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import {
  ChatInputBar,
  ChatMessages,
  ChatPanelFooter,
  ChatScrollArea,
  QuickQuestions,
} from "@/components/ai/chat-ui";
import { PilotBadge } from "@/components/brand/pilot-badge";
import { PilotAvatar } from "@/components/pilot/pilot-avatar";
import { useAiChat, useAiQuickQuestions } from "@/contexts/ai-chat-context";
import { subscribeOpenPilot } from "@/lib/pilot/pilot-ui-bridge";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AIAssistantPanel() {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage } = useAiChat();
  const quickQuestions = useAiQuickQuestions();
  const hasConversation = messages.some((m) => m.role === "user");

  useEffect(() => subscribeOpenPilot(() => setOpen(true)), []);

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
      <ChatPanelFooter>
        {!hasConversation && (
          <QuickQuestions
            questions={quickQuestions}
            onSelect={handleQuick}
            isLoading={isLoading}
          />
        )}
        <ChatInputBar
          value={input}
          onChange={setInput}
          onSend={() => void handleSend()}
          isLoading={isLoading}
          compact
          autoFocus={open}
        />
      </ChatPanelFooter>
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
        {!open && (
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="fixed right-3 sm:right-6 z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg shadow-primary/40 brand-cta-gradient hover:opacity-90 animate-float mobile-nav-offset lg:bottom-6"
            size="icon"
          >
            <Bot className="h-6 w-6" />
            <span className="sr-only">{t("aiPanel.open")}</span>
          </Button>
        )}

        <Sheet
          open={open}
          onOpenChange={(next) => {
            if (isLoading && !next) return;
            setOpen(next);
          }}
        >
          <SheetContent
            side="bottom"
            className="w-full max-w-none h-[min(88dvh,720px)] p-0 flex flex-col gap-0 rounded-t-2xl border-t [&>button]:hidden"
          >
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3 shrink-0 bg-gradient-to-r from-brand-accent-soft/50 to-transparent rounded-t-2xl">
              <PilotBadge
                title={t("brand.pilotName")}
                subtitle={t("aiPanel.subtitle")}
                size="sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full"
                onClick={() => setOpen(false)}
                aria-label={t("guestChat.close")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden">{panelBody}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
