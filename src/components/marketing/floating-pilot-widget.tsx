"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import {
  ChatInputBar,
  ChatMessages,
  ChatScrollArea,
  QuickQuestions,
} from "@/components/ai/chat-ui";
import { PilotBadge } from "@/components/brand/pilot-badge";
import { useGuestChat, useGuestQuickQuestions } from "@/hooks/use-guest-chat";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@movepilotai.com";

export function FloatingPilotWidget() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage } = useGuestChat();
  const quickQuestions = useGuestQuickQuestions();

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
      {/* Chat panel */}
      <div
        className={cn(
          "fixed z-[60] flex flex-col bg-card border shadow-2xl transition-all duration-300 ease-out",
          "inset-x-0 bottom-0 h-[min(85dvh,520px)] rounded-t-2xl",
          "sm:inset-x-auto sm:right-5 sm:bottom-24 sm:w-[380px] sm:h-[min(70dvh,560px)] sm:rounded-2xl",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none sm:translate-y-2"
        )}
        role="dialog"
        aria-label={t("guestChat.title")}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3 shrink-0 bg-gradient-to-r from-brand-accent-soft/50 to-transparent rounded-t-2xl">
          <PilotBadge
            title={t("brand.pilotName")}
            subtitle={t("guestChat.subtitle")}
            size="sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setOpen(false)}
            aria-label={t("guestChat.close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ChatScrollArea className="min-h-0 flex-1">
          <ChatMessages messages={messages} isLoading={isLoading} compact />
        </ChatScrollArea>

        <div className="border-t p-3 space-y-2.5 shrink-0 bg-muted/20 safe-bottom">
          <QuickQuestions
            questions={quickQuestions}
            onSelect={handleQuick}
            isLoading={isLoading}
          />
          <ChatInputBar
            value={input}
            onChange={setInput}
            onSend={() => void handleSend()}
            isLoading={isLoading}
            compact
            placeholder={t("guestChat.placeholder")}
          />
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
              <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t("guestChat.humanEmailSubject"))}`}>
                {t("guestChat.talkToHuman")}
              </a>
            </Button>
            <Button size="sm" className="flex-1 h-8 text-xs" asChild>
              <Link href="/onboarding" onClick={() => setOpen(false)}>
                {t("guestChat.startFree")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop mobile */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/20 sm:hidden"
          aria-label={t("guestChat.close")}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Floating launcher — light surface + navy icon for contrast on green hero sections */}
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed z-[60] h-14 w-14 rounded-full",
          "bg-white text-brand-navy border-2 border-white",
          "shadow-[0_4px_24px_rgba(15,23,42,0.22)] ring-2 ring-brand-navy/20",
          "hover:bg-white hover:text-brand-navy hover:brightness-[0.98]",
          "right-4 bottom-4 sm:right-6 sm:bottom-6",
          "transition-transform hover:scale-105 active:scale-95",
          open && "ring-brand-navy/35"
        )}
        size="icon"
        aria-expanded={open}
        aria-label={open ? t("guestChat.close") : t("guestChat.open")}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" strokeWidth={2.25} />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-white" />
            </span>
          </>
        )}
      </Button>
    </>
  );
}
