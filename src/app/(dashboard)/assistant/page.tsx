"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import {
  ChatInputBar,
  ChatMessages,
  QuickQuestions,
} from "@/components/ai/chat-ui";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useMove } from "@/contexts/move-context";
import { AI_QUICK_QUESTIONS, MOCK_USER } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage } = useAiChat();
  const { destinationAddress, destination, isAddressConfirmed } = useMove();

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  return (
    <>
      <DashboardHeader title="AI Assistant" description="GPT-powered moving co-pilot" />
      <PageContainer>
        <PageHeader
          title="AI Assistant"
          description="Real-time answers about your move — streaming for fast responses"
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 min-h-[480px] flex flex-col">
            <CardHeader className="border-b shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                MovePilot AI
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 min-h-[320px]">
              <div className="p-4 md:p-6">
                <ChatMessages messages={messages} isLoading={isLoading} />
              </div>
            </ScrollArea>
            <div className="border-t p-4 space-y-3 shrink-0">
              <QuickQuestions
                questions={AI_QUICK_QUESTIONS}
                onSelect={(q) => sendMessage(q)}
                isLoading={isLoading}
              />
              <ChatInputBar
                value={input}
                onChange={setInput}
                onSend={handleSend}
                isLoading={isLoading}
              />
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Quick questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {AI_QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => sendMessage(q.question)}
                    className="w-full rounded-lg border p-3 text-left text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {q.question}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Move context</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>{MOCK_USER.origin} → {destination}</p>
                <p className="break-words">
                  {isAddressConfirmed ? destinationAddress : "Address not set — add in Utilities"}
                </p>
                <p>Move date: Sep 15, 2026</p>
                <p>Budget: $4,000</p>
                <p>{MOCK_USER.household}</p>
                <p>{MOCK_USER.vehicles[0]} + trailer</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
