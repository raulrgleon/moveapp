"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { Input } from "@/components/ui/input";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface DashboardSearchProps {
  onNavigate?: () => void;
  autoFocus?: boolean;
}

export function DashboardSearch({ onNavigate, autoFocus }: DashboardSearchProps) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={t("common.search")}
        className="pl-9 h-10"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md max-h-72 overflow-y-auto">
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.id}`}
              href={r.href}
              className="block px-3 py-2 hover:bg-muted text-sm"
              onClick={() => {
                setOpen(false);
                setQuery("");
                onNavigate?.();
              }}
            >
              <p className="font-medium">{r.title}</p>
              {r.subtitle && (
                <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
