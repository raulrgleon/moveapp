import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  emoji?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  emoji = "📦",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-muted/20 to-transparent py-16 px-6 text-center animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-card border shadow-lg">
          <span className="text-3xl absolute -top-2 -right-2 animate-float" aria-hidden>
            {emoji}
          </span>
          <Icon className="h-9 w-9 text-primary" />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-display font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && (
        <Button className={cn("mt-6 shadow-md shadow-primary/20")} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
