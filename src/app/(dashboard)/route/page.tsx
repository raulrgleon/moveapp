import dynamic from "next/dynamic";
import { CloudRain, Fuel, Hotel, MapPin, PawPrint, Route as RouteIcon } from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";

const RouteMap = dynamic(
  () => import("@/components/dashboard/route-map-wrapper").then((m) => m.RouteMapWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[280px] sm:min-h-[360px] rounded-xl border bg-muted/30 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    ),
  }
);
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_USER, MOVE_STATS, ROUTE_STOPS } from "@/lib/mock-data";

const stopIcons = {
  gas: Fuel,
  hotel: Hotel,
  rest: MapPin,
  pet_hotel: PawPrint,
};

export default function RoutePage() {
  return (
    <>
      <DashboardHeader title="Route" description="Plan your drive with stops and alerts" />
      <PageContainer>
        <PageHeader
          title="Route Planner"
          description={`${MOCK_USER.origin} to ${MOCK_USER.destination}`}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total distance"
            value={`${MOVE_STATS.totalMiles} miles`}
            icon={RouteIcon}
          />
          <StatCard
            label="Est. drive time"
            value={MOVE_STATS.estimatedDriveTime}
            subtext="2-day route recommended"
            icon={RouteIcon}
          />
          <StatCard
            label="Suggested stops"
            value={`${ROUTE_STOPS.length}`}
            subtext="Gas, hotels, rest"
            icon={MapPin}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RouteMap className="min-h-[280px] sm:min-h-[360px]" showNewHome />

          <div className="space-y-4">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 flex gap-3">
                <CloudRain className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Weather alerts</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Possible thunderstorms in Nashville area on Sep 14–15. Monitor forecasts
                    before departure. No severe weather expected along primary route.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Route summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Origin</span>
                  <span className="font-medium">{MOCK_USER.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-medium">{MOCK_USER.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overnight stop</span>
                  <span className="font-medium">Nashville, TN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pet-friendly hotels</span>
                  <span className="font-medium">2 recommended</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested stops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROUTE_STOPS.map((stop) => {
                const Icon = stopIcons[stop.type];
                return (
                  <div
                    key={stop.id}
                    className="flex gap-3 rounded-lg border p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{stop.name}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {stop.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{stop.location}</p>
                      {stop.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{stop.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
