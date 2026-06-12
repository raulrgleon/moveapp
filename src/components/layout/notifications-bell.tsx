"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  read?: boolean;
}

export function NotificationsBell() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [count, setCount] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: NotificationItem[];
        unreadCount: number;
      };
      setItems(data.notifications);
      setCount(data.unreadCount);
    } catch {
      setItems([]);
      setCount(0);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setCount(0);
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => {
          setOpen((v) => !v);
          void load();
        }}
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]">
            {count > 9 ? "9+" : count}
          </Badge>
        )}
        <span className="sr-only">{t("common.notifications")}</span>
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-md border bg-popover shadow-md">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">{t("common.notifications")}</span>
            {count > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => void markAllRead()}
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">{t("notifications.empty")}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className={`block px-3 py-2 hover:bg-muted ${n.read ? "opacity-60" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.read && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {t("notifications.read")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
