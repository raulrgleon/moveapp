import { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  iconClassName?: string;
  glass?: boolean;
  numericValue?: number;
  numericSuffix?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconClassName,
  glass = false,
  numericValue,
  numericSuffix = "",
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        glass && "glass-card border-primary/10"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-xl sm:text-2xl font-semibold tracking-tight break-words">
              {numericValue != null ? (
                <CountUp value={numericValue} suffix={numericSuffix} />
              ) : (
                value
              )}
            </p>
            {subtext && <p className="text-xs text-muted-foreground break-words">{subtext}</p>}
          </div>
          <div className={cn("rounded-lg p-2.5 bg-primary/10 shrink-0", iconClassName)}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
