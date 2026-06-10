import { MapPin, Navigation } from "lucide-react";

interface MapPlaceholderProps {
  origin?: string;
  destination?: string;
  className?: string;
}

export function MapPlaceholder({
  origin = "Austin, TX",
  destination = "Huntington, WV",
  className,
}: MapPlaceholderProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br from-slate-100 to-slate-200 ${className}`}
    >
      <div className="absolute inset-0 opacity-30">
        <svg className="h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <path
            d="M 40 160 Q 120 80 200 100 T 360 60"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
            strokeDasharray="6 4"
          />
        </svg>
      </div>
      <div className="relative flex h-full min-h-[240px] flex-col items-center justify-center p-6">
        <Navigation className="h-10 w-10 text-primary/60" />
        <p className="mt-3 text-sm font-medium text-foreground">Route map preview</p>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-emerald-600" />
            {origin}
          </span>
          <span>→</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-primary" />
            {destination}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Interactive map integration coming soon
        </p>
      </div>
    </div>
  );
}
