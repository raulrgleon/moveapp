import { Check, ExternalLink, MapPinOff, Star, X } from "lucide-react";
import type { DestinationUtilityProvider } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UtilityProviderCardProps {
  provider: DestinationUtilityProvider;
}

export function UtilityProviderCard({ provider }: UtilityProviderCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col h-full",
        provider.isBestPick && "border-primary/40 shadow-md ring-1 ring-primary/20",
        !provider.availableAtAddress && "opacity-75"
      )}
    >
      <CardHeader className="pb-3 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                #{provider.rank} in {provider.categoryLabel}
              </span>
              {provider.isBestPick && (
                <Badge className="shrink-0">Best pick</Badge>
              )}
            </div>
            <h3 className="mt-1 font-semibold text-base leading-tight break-words">
              {provider.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-sm shrink-0">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">{provider.rating}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {provider.availableAtAddress ? (
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" />
              Available at your address
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <MapPinOff className="h-3 w-3" />
              Not at your address
            </Badge>
          )}
          <Badge variant="outline">{provider.categoryLabel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-2xl font-bold">
            {formatCurrency(provider.estimatedMonthlyPrice)}
          </span>
          <span className="text-sm text-muted-foreground">{provider.priceUnit}</span>
        </div>

        {provider.speedOrCapacity && (
          <p className="text-sm">
            <span className="font-medium">Speed / capacity:</span>{" "}
            <span className="text-muted-foreground">{provider.speedOrCapacity}</span>
          </p>
        )}

        <p className="text-sm text-muted-foreground">{provider.coverageNote}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Pros</p>
            <ul className="text-sm space-y-1">
              {provider.pros.map((p) => (
                <li key={p} className="flex gap-1.5 text-emerald-700">
                  <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Cons</p>
            <ul className="text-sm space-y-1">
              {provider.cons.map((c) => (
                <li key={c} className="flex gap-1.5 text-muted-foreground">
                  <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(provider.setupFee !== undefined || provider.contractMonths) && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
            {provider.setupFee !== undefined && (
              <span>Setup: {provider.setupFee === 0 ? "Free" : formatCurrency(provider.setupFee)}</span>
            )}
            {provider.contractMonths && (
              <span>Contract: {provider.contractMonths} months</span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button
          className="w-full sm:w-auto"
          disabled={!provider.availableAtAddress}
          variant={provider.isBestPick ? "default" : "outline"}
        >
          Set up service
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
        {provider.isBestPick && provider.availableAtAddress && (
          <Button variant="ghost" className="w-full sm:w-auto text-primary">
            Recommended for you
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
