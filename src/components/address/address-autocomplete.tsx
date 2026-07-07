"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, MapPin, Search } from "lucide-react";
import type { AddressSearchRegion } from "@/lib/geo/address-region";
import type { AddressSuggestion } from "@/lib/geo/nominatim";
import { DropdownPortal } from "@/components/ui/dropdown-portal";
import { Input } from "@/components/ui/input";
import { useT } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  initialValue?: string;
  disabled?: boolean;
  className?: string;
  /** Restrict street search to destination city/state area */
  region?: AddressSearchRegion;
}

export function AddressAutocomplete({
  onSelect,
  placeholder = "Start typing your new home address…",
  initialValue = "",
  disabled,
  className,
  region,
}: AddressAutocompleteProps) {
  const t = useT();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const regionReady = Boolean(region?.state?.trim() || (region?.lat != null && region?.lon != null));
  const isDisabled = disabled || !regionReady;

  const search = useCallback(
    async (text: string) => {
      if (!regionReady || text.trim().length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ q: text.trim() });
        if (region?.state) params.set("state", region.state);
        if (region?.city) params.set("city", region.city);
        if (region?.lat != null) params.set("lat", String(region.lat));
        if (region?.lon != null) params.set("lon", String(region.lon));

        const res = await fetch(`/api/address/search?${params.toString()}`);
        const data = (await res.json()) as AddressSuggestion[];
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [region, regionReady]
  );

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isDisabled) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 320);
    return () => clearTimeout(debounceRef.current);
  }, [query, search, isDisabled]);

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

  const handleSelect = (suggestion: AddressSuggestion) => {
    setQuery(suggestion.displayName);
    setOpen(false);
    setSuggestions([]);
    onSelect(suggestion);
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

  const regionHint =
    region?.state && region?.city
      ? t("address.searchInState", { city: region.city, state: region.state })
      : region?.state
        ? t("address.searchInStateOnly", { state: region.state })
        : t("address.selectDestinationFirst");

  return (
    <div ref={containerRef} className={cn("relative w-full space-y-1.5", className)}>
      <div ref={anchorRef} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isDisabled && !disabled ? regionHint : placeholder}
          disabled={isDisabled}
          className="pl-9 pr-9 h-11"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {regionReady && (
        <p className="text-xs text-muted-foreground">{regionHint}</p>
      )}

      {!regionReady && !disabled && (
        <p className="text-xs text-amber-700">{t("address.selectDestinationFirst")}</p>
      )}

      <DropdownPortal anchorRef={anchorRef} open={open && suggestions.length > 0}>
        <ul
          data-dropdown-portal
          className="w-full rounded-lg border bg-popover shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 max-h-60 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                  i === activeIndex && "bg-muted"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span className="break-words leading-snug">{s.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      </DropdownPortal>

      <DropdownPortal
        anchorRef={anchorRef}
        open={query.length >= 3 && !loading && suggestions.length === 0 && open && regionReady}
      >
        <div
          data-dropdown-portal
          className="w-full rounded-lg border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg"
        >
          {t("address.noResultsInState")}
        </div>
      </DropdownPortal>
    </div>
  );
}

export function AddressConfirmedBadge({ address }: { address: string }) {
  const t = useT();
  return (
    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm">
      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-medium text-emerald-900">{t("common.addressConfirmed")}</p>
        <p className="text-emerald-800/80 break-words text-xs mt-0.5">{address}</p>
      </div>
    </div>
  );
}
