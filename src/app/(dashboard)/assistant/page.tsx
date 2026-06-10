"use client";

import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AI_QUICK_QUESTIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi Raul! I'm your MovePilot co-pilot. I have full context on your Austin → Huntington move on September 15. What would you like help with?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleQuestion = (question: string, response: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `q-${Date.now()}`, role: "user", content: question },
      { id: `a-${Date.now()}`, role: "assistant", content: response },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const canned =
      AI_QUICK_QUESTIONS.find((q) =>
        input.toLowerCase().includes(q.question.toLowerCase().slice(0, 12))
      )?.response ??
      "I'm reviewing your move plan. Your top priorities this week: reserve the U-Haul trailer, book the Nashville hotel, and submit school enrollment forms.";

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: input },
      { id: `r-${Date.now()}`, role: "assistant", content: canned },
    ]);
    setInput("");
  };

  return (
    <>
      <DashboardHeader title="AI Assistant" description="Your moving co-pilot" />
      <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
        <PageHeader
          title="AI Assistant"
          description="Ask anything about your move — powered by your plan data"
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 min-h-[500px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                MovePilot AI
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-xl p-4 text-sm max-w-[85%]",
                      msg.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground ml-auto"
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your move..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button onClick={handleSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
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
                    onClick={() => handleQuestion(q.question, q.response)}
                    className="w-full rounded-lg border p-3 text-left text-sm hover:bg-muted transition-colors"
                  >
                    {q.question}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Context</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Austin, TX → Huntington, WV</p>
                <p>Move date: Sep 15, 2026</p>
                <p>Budget: $4,000</p>
                <p>Household: 2 adults, 1 child, 1 dog</p>
                <p>Vehicle: VW Atlas + trailer</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
