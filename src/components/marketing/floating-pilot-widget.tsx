"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import {
  ChatInputBar,
  ChatMessages,
  ChatPanelFooter,
  ChatScrollArea,
  QuickQuestions,
} from "@/components/ai/chat-ui";
import { PilotAvatar } from "@/components/pilot/pilot-avatar";
import { useGuestChat, useGuestQuickQuestions } from "@/hooks/use-guest-chat";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FloatingPilotWidget() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage } = useGuestChat();
  const quickQuestions = useGuestQuickQuestions();
  const hasConversation = messages.some((m) => m.role === "user");

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    if (!open) setOpen(true);
    await sendMessage(text);
  };

  const handleQuick = async (question: string) => {
    setOpen(true);
    await sendMessage(question);
  };

  return (
    <>
      <div
        className={cn(
          "fixed z-[70] flex flex-col bg-card border shadow-2xl transition-all duration-300 ease-out",
          "inset-x-0 bottom-0 h-[min(90dvh,640px)] rounded-t-2xl",
          "sm:inset-x-auto sm:right-5 sm:bottom-24 sm:w-[400px] sm:h-[min(72dvh,580px)] sm:rounded-2xl",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-6 pointer-events-none sm:translate-y-2"
        )}
        role="dialog"
        aria-label={t("guestChat.title")}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 shrink-0 bg-gradient-to-r from-brand-accent-soft/50 via-primary/10 to-transparent rounded-t-2xl safe-top">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <PilotAvatar size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{t("brand.pilotName")}</p>
              <p className="text-xs text-muted-foreground truncate">{t("guestChat.subtitle")}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            onClick={() => setOpen(false)}
            aria-label={t("guestChat.close")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ChatScrollArea className="min-h-0 flex-1" autoScrollDeps={[messages, isLoading]}>
          <ChatMessages messages={messages} isLoading={isLoading} compact />
        </ChatScrollArea>

        <ChatPanelFooter className="space-y-3">
          {!hasConversation && (
            <QuickQuestions
              questions={quickQuestions}
              onSelect={handleQuick}
              isLoading={isLoading}
            />
          )}
          <ChatInputBar
            value={input}
            onChange={setInput}
            onSend={() => void handleSend()}
            isLoading={isLoading}
            placeholder={t("guestChat.placeholder")}
            autoFocus={open}
          />
          {!hasConversation && (
            <Button className="w-full h-11 text-sm" asChild>
              <Link href="/onboarding" onClick={() => setOpen(false)}>
                {t("guestChat.startFree")}
              </Link>
            </Button>
          )}
        </ChatPanelFooter>
      </div>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/30 sm:hidden"
          aria-label={t("guestChat.close")}
          onClick={() => setOpen(false)}
        />
      )}

      {!open && (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed z-[60] h-14 w-14 rounded-full animate-float",
            "bg-gradient-to-br from-primary via-brand-accent to-primary text-primary-foreground",
            "border-2 border-white/90 shadow-[0_8px_32px_rgba(15,23,42,0.35)] ring-2 ring-primary/30",
            "hover:brightness-110 hover:scale-105 active:scale-95",
            "right-4 bottom-4 sm:right-6 sm:bottom-6 safe-bottom",
            "transition-transform"
          )}
          size="icon"
          aria-expanded={false}
          aria-label={t("guestChat.open")}
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2.25} />
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-white" />
          </span>
        </Button>
      )}
    </>
  );
}
