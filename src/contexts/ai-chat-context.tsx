"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useInventory } from "@/contexts/inventory-context";
import { useMove } from "@/contexts/move-context";
import { useChecklist } from "@/contexts/checklist-context";
import { useLocale } from "@/contexts/locale-context";
import { useRouteStats } from "@/hooks/use-route-stats";
import { AI_QUICK_QUESTIONS } from "@/lib/mock-data";
import { translate } from "@/lib/i18n";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AiChatContextValue {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

function findCannedResponse(text: string): string | undefined {
  const trimmed = text.trim();
  return AI_QUICK_QUESTIONS.find((q) => q.question === trimmed)?.response;
}

export function AiChatProvider({ children }: { children: React.ReactNode }) {
  const { getMoveContextForApi } = useMove();
  const { boxes } = useInventory();
  const { tasks } = useChecklist();
  const { stats } = useRouteStats();
  const { locale } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessages((prev) => {
      const welcome = translate(locale, "chat.welcome");
      if (prev.length === 0) {
        return [{ id: "welcome", role: "assistant", content: welcome }];
      }
      return prev.map((m) =>
        m.id === "welcome" ? { ...m, content: welcome } : m
      );
    });
  }, [locale]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const canned = findCannedResponse(trimmed);

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

      if (canned) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: canned } : m
          )
        );
        setIsLoading(false);
        return;
      }

      try {
        const completed = tasks.filter((t) => t.status === "completed").length;
        const taskProgress = tasks.length
          ? Math.round((completed / tasks.length) * 100)
          : undefined;

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
              routeStats: stats
                ? {
                    distanceMiles: stats.distanceMiles,
                    driveTimeLabel: stats.driveTimeLabel,
                    taskCompletionPercent: taskProgress,
                  }
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
        const fallback = findCannedResponse(trimmed);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    fallback ?? translate(locale, "chat.error"),
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, getMoveContextForApi, boxes, tasks, stats, locale]
  );

  const value = useMemo(
    () => ({ messages, isLoading, sendMessage }),
    [messages, isLoading, sendMessage]
  );

  return (
    <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
  );
}

export function useAiChat() {
  const ctx = useContext(AiChatContext);
  if (!ctx) throw new Error("useAiChat must be used within AiChatProvider");
  return ctx;
}
