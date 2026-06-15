"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownPortal } from "@/components/ui/dropdown-portal";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

export interface CitySelection {
  label: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
}

interface CitySuggestion extends CitySelection {
  placeId: string;
  displayName: string;
}

interface CityAutocompleteProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (city: CitySelection) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function formatCityLabel(item: {
  city?: string;
  state?: string;
  displayName: string;
}): string {
  const city =
    item.city?.trim() ||
    item.displayName.split(",")[0]?.trim() ||
    item.displayName;
  const state = item.state?.trim();
  if (state) {
    const abbr = state.length > 3 ? state : state.toUpperCase();
    return `${city}, ${abbr}`;
  }
  return city;
}

export function CityAutocomplete({
  id,
  label,
  value,
  onChange,
  onSelect,
  placeholder = "City, State",
  disabled,
  className,
}: CityAutocompleteProps) {
  const t = useT();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const search = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/address/search?q=${encodeURIComponent(text.trim())}&type=city`
      );
      const data = (await res.json()) as CitySuggestion[];
      setSuggestions(data);
      setHasSearched(true);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
      setHasSearched(true);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (disabled) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 220);
    return () => clearTimeout(debounceRef.current);
  }, [query, search, disabled]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-dropdown-portal]")) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: CitySuggestion) => {
    const labelText = formatCityLabel(suggestion);
    setQuery(labelText);
    onChange(labelText);
    setOpen(false);
    setSuggestions([]);
    onSelect({
      label: labelText,
      lat: suggestion.lat,
      lon: suggestion.lon,
      city: suggestion.city,
      state: suggestion.state,
    });
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    onChange(text);
    if (text.trim().length >= 2) {
      setOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <p className="text-xs text-muted-foreground">{t("cityAutocomplete.hint")}</p>
      <div ref={anchorRef} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="h-12 pl-9 pr-9 text-base"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <DropdownPortal anchorRef={anchorRef} open={open && suggestions.length > 0}>
        <ul
          data-dropdown-portal
          className="w-full rounded-xl border bg-popover shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 max-h-60 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((s, i) => {
            const cityLabel = formatCityLabel(s);
            return (
              <li key={s.placeId} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-muted",
                    i === activeIndex && "bg-muted"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(s)}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span className="font-medium leading-snug">{cityLabel}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </DropdownPortal>

      <DropdownPortal
        anchorRef={anchorRef}
        open={open && hasSearched && !loading && suggestions.length === 0 && query.trim().length >= 2}
      >
        <div
          data-dropdown-portal
          className="w-full rounded-xl border bg-popover px-3 py-2.5 text-sm text-muted-foreground shadow-lg"
        >
          {t("cityAutocomplete.noResults")}
        </div>
      </DropdownPortal>
    </div>
  );
}
