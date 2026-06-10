"use client";

import Link from "next/link";
import { Sparkles, Zap } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UTILITY_AI_SUMMARY } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export function DashboardUtilitiesCard() {
  const { isAddressConfirmed, destinationAddress, isHydrated } = useMove();

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Home utilities at your new address
          </CardTitle>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/utilities">
              {isAddressConfirmed ? "View all services" : "Set up address"}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isHydrated && isAddressConfirmed ? (
          <>
            <p className="text-sm text-muted-foreground break-words">
              {destinationAddress}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {UTILITY_AI_SUMMARY.bestPicks.slice(0, 4).map((pick) => (
                <div
                  key={pick.category}
                  className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                >
                  <p className="text-xs text-muted-foreground">{pick.category}</p>
                  <p className="font-medium mt-0.5 truncate">{pick.provider}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="break-words">
                Est. {formatCurrency(UTILITY_AI_SUMMARY.estimatedMonthlyTotal)}/mo total utilities
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add your new home address in Utilities to unlock provider recommendations
            for electricity, water, fiber, and more.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
