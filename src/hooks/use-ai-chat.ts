"use client";

import { useCallback, useEffect, useState } from "react";
import { useInventory } from "@/contexts/inventory-context";
import { useMove } from "@/contexts/move-context";
import { useLocale } from "@/contexts/locale-context";
import { translate } from "@/lib/i18n";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useAiChat() {
  const { getMoveContextForApi } = useMove();
  const { boxes } = useInventory();
  const { locale } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: translate(locale, "chat.welcome"),
      },
    ]);
  }, [locale]);

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
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            moveContext: {
              ...getMoveContextForApi(),
              inventorySummary:
                boxes.length > 0
                  ? boxes
                      .map(
                        (b) =>
                          `#${b.boxNumber} (${b.room}, ${b.status}): ${b.contents}`
                      )
                      .join("; ")
                  : undefined,
            },
            locale,
          }),
        });

        if (!res.ok) {
          throw new Error("Chat request failed");
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            full += decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: full } : m
              )
            );
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: translate(locale, "chat.error"),
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, getMoveContextForApi, boxes, locale]
  );

  return { messages, isLoading, sendMessage };
}
