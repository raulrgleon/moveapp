"use client";

import { useCallback, useState } from "react";
import { Bot } from "lucide-react";
import {
  ChatInputBar,
  ChatMessages,
  ChatPanelFooter,
  ChatScrollArea,
} from "@/components/ai/chat-ui";
import { PilotBadge } from "@/components/brand/pilot-badge";
import { useT } from "@/contexts/locale-context";
import { getClientLocale } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { ChatMessage } from "@/contexts/ai-chat-context";

export function AdminPilotPanel() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: t("adminConsole.pilotWelcome") },
  ]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      const assistantId = `a-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      const history = [
        ...messages.filter((m) => m.id !== "welcome" && m.content.length > 0),
        userMsg,
      ];

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/admin/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Locale": getClientLocale(),
          },
          credentials: "include",
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok) throw new Error("Chat failed");

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            full += decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
            );
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: t("chat.error") } : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, t]
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg p-0"
          aria-label={t("adminConsole.pilotTitle")}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <div className="border-b p-4 shrink-0 bg-gradient-to-r from-brand-accent-soft/50 to-transparent">
          <PilotBadge title={t("adminConsole.pilotTitle")} subtitle={t("adminConsole.pilotSubtitle")} />
        </div>
        <ChatScrollArea autoScrollDeps={[messages, isLoading]} className="flex-1 min-h-0">
          <ChatMessages messages={messages} isLoading={isLoading} compact />
        </ChatScrollArea>
        <ChatPanelFooter>
          <ChatInputBar
            value={input}
            onChange={setInput}
            onSend={() => {
              const text = input;
              setInput("");
              void sendMessage(text);
            }}
            isLoading={isLoading}
            compact
            autoFocus={open}
            placeholder={t("adminConsole.pilotPlaceholder")}
          />
        </ChatPanelFooter>
      </SheetContent>
    </Sheet>
  );
}
