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
import { useLocale, useT } from "@/contexts/locale-context";
import { useRouteStats } from "@/hooks/use-route-stats";
import { translate, type Locale } from "@/lib/i18n";
import {
  formatActionResultMessage,
  parsePilotActions,
  stripPilotActions,
} from "@/lib/ai/pilot-actions";
import { resolveReplyLocale } from "@/lib/ai/detect-message-locale";
import { isUpgradeRequiredResponse } from "@/lib/api-client";
import { showPaywallModal } from "@/lib/billing/paywall-bridge";
import { MOVE_PROFILE_UPDATED } from "@/lib/move/profile-events";
import type { AIQuickQuestion } from "@/lib/types";

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

const QUICK_QUESTION_IDS = ["1", "2", "3", "4", "5"] as const;

export function useAiQuickQuestions(): AIQuickQuestion[] {
  const t = useT();
  return QUICK_QUESTION_IDS.map((id) => ({
    id,
    question: t(`chat.quickQ${id}.question`),
    response: t(`chat.quickQ${id}.response`),
  }));
}

function findCannedResponse(text: string, appLocale: Locale): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  for (const id of QUICK_QUESTION_IDS) {
    const enQuestion = translate("en", `chat.quickQ${id}.question`);
    const esQuestion = translate("es", `chat.quickQ${id}.question`);
    if (trimmed === enQuestion || trimmed === esQuestion) {
      const replyLocale = resolveReplyLocale(trimmed, appLocale);
      return translate(replyLocale, `chat.quickQ${id}.response`);
    }
  }
  return undefined;
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

      const canned = findCannedResponse(trimmed, locale);
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
              locale: replyLocale,
              userMessage: trimmed,
              inventorySummary:
                boxes.length > 0
                  ? boxes
                      .map(
                        (b) =>
                          `#${b.boxNumber} ${b.room}→${b.destinationRoom ?? b.room} (${b.status}${b.fragile ? ", fragile" : ""}${b.essentials ? ", essentials" : ""}): ${b.contents}`
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
            locale: replyLocale,
          }),
        });

        if (isUpgradeRequiredResponse(res)) {
          let trialExpired = false;
          let trialDaysLeft = 0;
          try {
            const json = (await res.json()) as {
              trialExpired?: boolean;
              trialDaysLeft?: number;
            };
            trialExpired = Boolean(json.trialExpired);
            trialDaysLeft = json.trialDaysLeft ?? 0;
          } catch {
            /* ignore */
          }
          showPaywallModal({
            trialExpired,
            trialDaysLeft,
            returnTo: window.location.pathname + window.location.search,
          });
          return;
        }

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
            const display = stripPilotActions(full);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: display } : m
              )
            );
          }
        }

        const actions = parsePilotActions(full);
        if (actions.length > 0) {
          const results: { ok: boolean; label: string }[] = [];
          for (const action of actions) {
            try {
              const actionRes = await fetch("/api/chat/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(action),
              });
              const data = (await actionRes.json()) as { ok?: boolean; label?: string };
              results.push({
                ok: actionRes.ok && Boolean(data.ok),
                label: data.label ?? action.action,
              });
            } catch {
              results.push({ ok: false, label: action.action });
            }
          }
          const suffix = formatActionResultMessage(replyLocale, results);
          if (suffix) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: stripPilotActions(full) + suffix } : m
              )
            );
            window.dispatchEvent(new Event(MOVE_PROFILE_UPDATED));
          }
        }
      } catch {
        const fallback = findCannedResponse(trimmed, locale);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    fallback ?? translate(replyLocale, "chat.error"),
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
