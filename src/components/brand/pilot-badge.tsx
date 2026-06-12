import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

interface PilotBadgeProps {
  className?: string;
  title?: string;
  subtitle?: string;
  size?: "sm" | "md";
}

/** AI assistant identity — "Pilot" co-pilot */
export function PilotBadge({ className, title, subtitle, size = "md" }: PilotBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        <BrandMark size={size === "sm" ? "sm" : "md"} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-accent text-[8px] font-bold text-white ring-2 ring-card">
          AI
        </span>
      </div>
      {(title || subtitle) && (
        <div className="min-w-0">
          {title && <p className="text-sm font-semibold leading-tight">{title}</p>}
          {subtitle && (
            <p className="text-xs text-muted-foreground leading-tight truncate">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
