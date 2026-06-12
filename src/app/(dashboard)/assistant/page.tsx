"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  ChatInputBar,
  ChatMessages,
  ChatScrollArea,
  QuickQuestions,
} from "@/components/ai/chat-ui";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useAiQuickQuestions } from "@/contexts/ai-chat-context";
import { useT } from "@/contexts/locale-context";

export default function AssistantPage() {
  const t = useT();
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage } = useAiChat();
  const quickQuestions = useAiQuickQuestions();

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  return (
    <>
      <DashboardHeader title={t("assistant.title")} description={t("assistant.subtitle")} />
      <PageContainer className="flex flex-col min-h-[calc(100dvh-8rem)] max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("aiPanel.title")}</p>
            <p className="text-xs text-muted-foreground">{t("aiPanel.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col rounded-xl border bg-card min-h-0">
          <ChatScrollArea className="min-h-[50vh]">
            <ChatMessages messages={messages} isLoading={isLoading} />
          </ChatScrollArea>
          <div className="border-t p-4 space-y-3 shrink-0">
            <QuickQuestions
              questions={quickQuestions}
              onSelect={(q) => void sendMessage(q)}
              isLoading={isLoading}
            />
            <ChatInputBar
              value={input}
              onChange={setInput}
              onSend={() => void handleSend()}
              isLoading={isLoading}
            />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
