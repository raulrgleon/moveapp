"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "@/contexts/ai-chat-context";
import { useLocale } from "@/contexts/locale-context";
import { translate } from "@/lib/i18n";
import { resolveReplyLocale } from "@/lib/ai/detect-message-locale";

const STORAGE_KEY = "movepilot_guest_chat_v1";

const QUICK_IDS = ["pricing", "features", "start", "human"] as const;

function loadStoredMessages(locale: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { locale?: string; messages?: ChatMessage[] };
    if (parsed.locale !== locale) return [];
    return parsed.messages ?? [];
  } catch {
    return [];
  }
}

function saveStoredMessages(locale: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        locale,
        messages: messages.filter((m) => m.id !== "welcome").slice(-12),
      })
    );
  } catch {
    /* ignore quota */
  }
}

export function useGuestQuickQuestions() {
  const { locale } = useLocale();
  return useMemo(
    () =>
      QUICK_IDS.map((id) => ({
        id,
        question: translate(locale, `guestChat.quickQ.${id}`),
      })),
    [locale]
  );
}

export function useGuestChat() {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const welcome = translate(locale, "guestChat.welcome");
    const stored = loadStoredMessages(locale);
    if (stored.length > 0) {
      setMessages([{ id: "welcome", role: "assistant", content: welcome }, ...stored]);
    } else {
      setMessages([{ id: "welcome", role: "assistant", content: welcome }]);
    }
    setHydrated(true);
  }, [locale]);

  useEffect(() => {
    if (!hydrated) return;
    saveStoredMessages(locale, messages);
  }, [messages, locale, hydrated]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      const replyLocale = resolveReplyLocale(trimmed, locale);

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
        const res = await fetch("/api/chat/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            locale: replyLocale,
          }),
        });

        if (!res.ok) throw new Error("Chat request failed");

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
            m.id === assistantId
              ? { ...m, content: translate(replyLocale, "guestChat.error") }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, locale]
  );

  return { messages, isLoading, sendMessage };
}
