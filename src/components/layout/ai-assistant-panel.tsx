"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Sparkles } from "lucide-react";
import {
  ChatInputBar,
  ChatMessages,
  ChatScrollArea,
  QuickQuestions,
} from "@/components/ai/chat-ui";
import { useAiChat, useAiQuickQuestions } from "@/contexts/ai-chat-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
    setOpen(true);
    await sendMessage(text);
  };

  const handleQuick = async (question: string) => {
    setOpen(true);
    await sendMessage(question);
  };

  const panelBody = (
    <>
      <ChatScrollArea>
        <ChatMessages messages={messages} isLoading={isLoading} compact />
      </ChatScrollArea>
      <div className="border-t p-4 space-y-3 shrink-0">
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
        <div className="flex items-center gap-2 border-b p-4 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("aiPanel.title")}</p>
            <p className="text-xs text-muted-foreground">{t("aiPanel.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col min-h-0">{panelBody}</div>
      </aside>

      <div className="xl:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              className="fixed right-4 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg mobile-nav-offset lg:bottom-6"
              size="icon"
            >
              <Bot className="h-6 w-6" />
              <span className="sr-only">{t("aiPanel.open")}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="border-b p-4 shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("assistant.title")}
              </SheetTitle>
            </SheetHeader>
            {panelBody}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
