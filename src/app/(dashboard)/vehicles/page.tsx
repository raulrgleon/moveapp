import { Car, Fuel, Sparkles, Wrench } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_USER, VEHICLE_OPTIONS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function VehiclesPage() {
  return (
    <>
      <DashboardHeader title="Vehicles" description="Transport planning for your car" />
      <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
        <PageHeader
          title="Car Transport & Vehicle Planning"
          description="Options for your 2019 Volkswagen Atlas"
        />

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <Car className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{MOCK_USER.vehicles[0]}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tow capacity: 5,000 lbs · AWD · Suitable for trailer towing
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {VEHICLE_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={cn(option.recommended && "border-primary shadow-md")}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{option.title}</CardTitle>
                  {option.recommended && (
                    <Badge className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Recommended
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{option.description}</p>
                <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Est. cost</p>
                    <p className="font-semibold">{formatCurrency(option.estimatedCost)}</p>
                  </div>
                  {option.fuelEstimate !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Fuel className="h-3 w-3" /> Fuel
                      </p>
                      <p className="font-semibold">{formatCurrency(option.fuelEstimate)}</p>
                    </div>
                  )}
                  {option.wearAndTear !== undefined && option.wearAndTear > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Wrench className="h-3 w-3" /> Wear & tear
                      </p>
                      <p className="font-semibold">{formatCurrency(option.wearAndTear)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparison summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>Drive + trailer:</strong> ~$705 total (fuel + trailer rental) — best value
            </p>
            <p>
              <strong>Ship vehicle:</strong> ~$1,100 — consider if you prefer not to drive long distance
            </p>
            <p>
              <strong>Tow dolly:</strong> Not recommended with trailer combo on Atlas
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
