"use client";

import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useT } from "@/contexts/locale-context";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import type { ChatMessage } from "@/hooks/use-ai-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  compact?: boolean;
}

export function ChatMessages({ messages, isLoading, compact }: ChatMessagesProps) {
  const t = useT();

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "rounded-xl text-sm break-words",
            compact ? "p-3" : "p-3 md:p-4",
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
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("chat.thinking")}
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
  placeholder?: string;
  /** Focus input when the chat panel opens. */
  autoFocus?: boolean;
  /** Refocus after send and when the assistant finishes (default true). */
  keepFocus?: boolean;
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  isLoading,
  compact,
  placeholder,
  autoFocus,
  keepFocus = true,
}: ChatInputBarProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const wasLoadingRef = useRef(Boolean(isLoading));

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    if (!autoFocus) return;
    const id = window.setTimeout(() => focusInput(), 50);
    return () => window.clearTimeout(id);
  }, [autoFocus, focusInput]);

  useEffect(() => {
    if (keepFocus && wasLoadingRef.current && !isLoading) {
      focusInput();
    }
    wasLoadingRef.current = Boolean(isLoading);
  }, [isLoading, keepFocus, focusInput]);

  return (
    <form
      className="flex gap-2.5 items-stretch"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isLoading && value.trim()) {
          onSend();
        }
      }}
    >
      <Input
        ref={inputRef}
        placeholder={placeholder ?? t("chat.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        enterKeyHint="send"
        className={cn(
          "flex-1 min-w-0 rounded-xl",
          /* 44px+ touch target on mobile; text-base avoids iOS zoom on focus */
          "h-12 text-base px-4 sm:text-sm sm:h-10",
          compact && "sm:h-9 sm:px-3"
        )}
      />
      <Button
        type="submit"
        size="icon"
        aria-label={t("chat.send")}
        className={cn(
          "shrink-0 rounded-xl",
          "h-12 w-12 sm:h-10 sm:w-10",
          compact && "sm:h-9 sm:w-9",
          "[&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-4 sm:[&_svg]:w-4"
        )}
        disabled={isLoading || !value.trim()}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Send />
        )}
      </Button>
    </form>
  );
}

interface QuickQuestionsProps {
  questions: { id: string; question: string }[];
  onSelect: (q: string) => void;
  isLoading?: boolean;
}

export function QuickQuestions({ questions, onSelect, isLoading }: QuickQuestionsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 scrollbar-none sm:flex-wrap sm:overflow-visible">
      {questions.map((q) => (
        <button
          key={q.id}
          type="button"
          disabled={isLoading}
          onClick={() => onSelect(q.question)}
          className="shrink-0 rounded-full border bg-background px-3.5 py-2.5 min-h-[44px] text-xs sm:text-xs sm:min-h-0 sm:py-1 sm:px-2.5 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 text-left max-w-[85vw] sm:max-w-none"
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
  autoScrollDeps = [],
}: {
  children: React.ReactNode;
  className?: string;
  autoScrollDeps?: readonly unknown[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstScroll = useRef(true);
  const depsKey = autoScrollDeps.map((d) => String(d)).join("\0");

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const behavior = isFirstScroll.current ? "auto" : "smooth";
    isFirstScroll.current = false;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [depsKey]);

  return (
    <div
      ref={scrollRef}
      className={cn("flex-1 min-h-0 overflow-y-auto overscroll-contain", className)}
    >
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

/** Shared footer chrome for mobile chat panels (safe area + spacing). */
export function ChatPanelFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t shrink-0 bg-muted/20 safe-bottom",
        "p-3 sm:p-4 space-y-3",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      {children}
    </div>
  );
}
