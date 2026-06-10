"use client";

import { Loader2, Send } from "lucide-react";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import type { ChatMessage } from "@/hooks/use-ai-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  compact?: boolean;
}

export function ChatMessages({ messages, isLoading, compact }: ChatMessagesProps) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "rounded-lg text-sm break-words",
            compact ? "p-2.5" : "p-3 md:p-4",
            compact ? "max-w-full" : "max-w-[90%]",
            msg.role === "assistant"
              ? "bg-muted text-foreground"
              : "bg-primary text-primary-foreground ml-auto"
          )}
        >
          {msg.role === "assistant" && msg.content ? (
            <MarkdownMessage content={msg.content} />
          ) : msg.role === "user" ? (
            msg.content
          ) : isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

interface ChatInputBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  isLoading,
  compact,
}: ChatInputBarProps) {
  return (
    <div className="flex gap-2">
      <Input
        placeholder="Ask about your move..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !isLoading && onSend()}
        disabled={isLoading}
        className={compact ? "h-9" : undefined}
      />
      <Button
        size="icon"
        className={cn("shrink-0", compact && "h-9 w-9")}
        onClick={onSend}
        disabled={isLoading || !value.trim()}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

interface QuickQuestionsProps {
  questions: { id: string; question: string }[];
  onSelect: (q: string) => void;
  isLoading?: boolean;
}

export function QuickQuestions({ questions, onSelect, isLoading }: QuickQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q) => (
        <button
          key={q.id}
          type="button"
          disabled={isLoading}
          onClick={() => onSelect(q.question)}
          className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 text-left"
        >
          {q.question}
        </button>
      ))}
    </div>
  );
}

export function ChatScrollArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ScrollArea className={cn("flex-1", className)}>
      <div className="p-4">{children}</div>
    </ScrollArea>
  );
}
