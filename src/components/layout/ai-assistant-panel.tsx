"use client";

import { useState } from "react";
import { Bot, MessageSquare, Send, Sparkles } from "lucide-react";
import { AI_QUICK_QUESTIONS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AIAssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi Raul! I'm your MovePilot co-pilot. I know you're moving from Austin to Huntington on September 15. Ask me anything about your move.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleQuickQuestion = (question: string, response: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `q-${Date.now()}`, role: "user", content: question },
      { id: `a-${Date.now()}`, role: "assistant", content: response },
    ]);
    setOpen(true);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const canned =
      AI_QUICK_QUESTIONS.find((q) =>
        input.toLowerCase().includes(q.question.toLowerCase().slice(0, 15))
      )?.response ??
      "I'm analyzing your move plan. Based on your Austin → Huntington route, I recommend focusing on trailer reservation and school enrollment this week. Check the Moving Plan page for your prioritized tasks.";

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: input },
      { id: `r-${Date.now()}`, role: "assistant", content: canned },
    ]);
    setInput("");
    setOpen(true);
  };

  return (
    <>
      {/* Desktop side panel */}
      <aside className="hidden xl:flex xl:w-80 xl:flex-col xl:border-l xl:bg-card">
        <div className="flex items-center gap-2 border-b p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Assistant</p>
            <p className="text-xs text-muted-foreground">Move co-pilot</p>
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg p-3 text-sm",
                  msg.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground ml-4"
                )}
              >
                {msg.content}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {AI_QUICK_QUESTIONS.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuickQuestion(q.question, q.response)}
                className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                {q.question}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ask about your move..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="h-9"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile floating button + sheet */}
      <div className="xl:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
              size="icon"
            >
              <Bot className="h-6 w-6" />
              <span className="sr-only">Open AI Assistant</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="border-b p-4">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Assistant
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-lg p-3 text-sm",
                      msg.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground ml-4"
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {AI_QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleQuickQuestion(q.question, q.response)}
                    className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    {q.question}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your move..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button size="icon" onClick={handleSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export function AIAssistantQuickBar() {
  return (
    <div className="hidden lg:flex xl:hidden items-center gap-2 border-t bg-muted/30 px-4 py-2">
      <MessageSquare className="h-4 w-4 text-primary shrink-0" />
      <p className="text-xs text-muted-foreground flex-1">
        AI Assistant available — open on larger screens or tap the bot icon on mobile
      </p>
    </div>
  );
}
