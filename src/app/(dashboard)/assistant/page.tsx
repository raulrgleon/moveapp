"use client";

import { useState } from "react";
import {
  ChatInputBar,
  ChatMessages,
  ChatScrollArea,
  QuickQuestions,
} from "@/components/ai/chat-ui";
import { PilotBadge } from "@/components/brand/pilot-badge";
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
        <div className="rounded-xl border bg-gradient-to-r from-brand-accent-soft/60 via-background to-brand/5 p-4 mb-4">
          <PilotBadge
            title={t("brand.pilotName")}
            subtitle={t("brand.pilotIntro")}
            size="md"
          />
        </div>
        <div className="flex flex-1 flex-col rounded-xl border bg-card min-h-0 shadow-sm">
          <ChatScrollArea className="min-h-[50vh]">
            <ChatMessages messages={messages} isLoading={isLoading} />
          </ChatScrollArea>
          <div className="border-t p-4 space-y-3 shrink-0 bg-muted/20">
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
