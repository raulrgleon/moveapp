"use client";

import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MoveDatePickerProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MoveDatePicker({
  id = "moveDate",
  label,
  value,
  onChange,
  className,
}: MoveDatePickerProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Calendar className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
        <input
          id={id}
          type="date"
          value={value}
          min={today}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "flex h-14 w-full rounded-xl border border-input bg-background pl-12 pr-4",
            "text-base font-medium text-foreground shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "[color-scheme:light] dark:[color-scheme:dark]",
            "appearance-none min-h-[3.5rem]"
          )}
        />
      </div>
    </div>
  );
}
