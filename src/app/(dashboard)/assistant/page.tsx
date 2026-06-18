"use client";

import { useState } from "react";
import {
  ChatInputBar,
  ChatMessages,
  ChatPanelFooter,
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
      <PageContainer className="flex flex-col min-h-[calc(100dvh-3.5rem-5rem-env(safe-area-inset-bottom,0px))] sm:min-h-[calc(100dvh-4rem-2rem)] max-w-3xl mx-auto">
        <div className="rounded-xl border bg-gradient-to-r from-brand-accent-soft/60 via-background to-brand/5 p-3 sm:p-4 mb-4">
          <PilotBadge
            title={t("brand.pilotName")}
            subtitle={t("brand.pilotIntro")}
            size="md"
          />
        </div>
        <div className="flex flex-1 flex-col rounded-xl border bg-card min-h-0 shadow-sm overflow-hidden">
          <ChatScrollArea className="min-h-[40dvh] sm:min-h-[50vh] flex-1" autoScrollDeps={[messages, isLoading]}>
            <ChatMessages messages={messages} isLoading={isLoading} />
          </ChatScrollArea>
          <ChatPanelFooter>
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
          </ChatPanelFooter>
        </div>
      </PageContainer>
    </>
  );
}
