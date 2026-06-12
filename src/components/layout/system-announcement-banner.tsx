"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  message: string;
  type: string;
}

const TYPE_STYLES: Record<string, string> = {
  info: "bg-blue-600 text-white",
  warning: "bg-amber-500 text-amber-950",
  maintenance: "bg-slate-800 text-white",
};

const TYPE_ICONS = {
  info: Info,
  warning: AlertTriangle,
  maintenance: Wrench,
} as const;

export function SystemAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/announcement");
        if (!res.ok) return;
        const data = (await res.json()) as { announcements: Announcement[] };
        setAnnouncements(data.announcements);
      } catch {
        /* ignore */
      }
    }
    void load();
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="shrink-0">
      {announcements.map((item) => {
        const Icon = TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] ?? Info;
        return (
          <div
            key={item.id}
            className={cn(
              "px-4 py-2.5 text-sm flex items-start gap-2 justify-center text-center",
              TYPE_STYLES[item.type] ?? TYPE_STYLES.info
            )}
          >
            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}
