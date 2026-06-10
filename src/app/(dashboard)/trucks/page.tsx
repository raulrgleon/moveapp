import { ExternalLink, Sparkles, Truck } from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TRAILER_RECOMMENDATION, TRUCK_OPTIONS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function TrucksPage() {
  const trucks = TRUCK_OPTIONS.filter((o) => o.type === "truck");
  const trailers = TRUCK_OPTIONS.filter((o) => o.type === "trailer");

  return (
    <>
      <DashboardHeader title="Trucks & Trailers" description="Compare rental options" />
      <PageContainer>
        <PageHeader
          title="Moving Truck & Trailer Finder"
          description="Compare providers for your Austin → Huntington move"
        />

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-medium">AI recommendation</p>
              <p className="mt-1 text-sm text-muted-foreground">{TRAILER_RECOMMENDATION}</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="trailers">
          <TabsList>
            <TabsTrigger value="trailers">Trailers</TabsTrigger>
            <TabsTrigger value="trucks">Trucks</TabsTrigger>
            <TabsTrigger value="all">All options</TabsTrigger>
          </TabsList>

          <TabsContent value="trailers" className="mt-6">
            <OptionGrid options={trailers} />
          </TabsContent>
          <TabsContent value="trucks" className="mt-6">
            <OptionGrid options={trucks} />
          </TabsContent>
          <TabsContent value="all" className="mt-6">
            <OptionGrid options={TRUCK_OPTIONS} />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}

function OptionGrid({ options }: { options: typeof TRUCK_OPTIONS }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {options.map((option) => (
        <Card key={option.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{option.company}</CardTitle>
                  <p className="text-sm text-muted-foreground">{option.vehicleSize}</p>
                </div>
              </div>
              <Badge variant={option.type === "trailer" ? "default" : "secondary"}>
                {option.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{formatCurrency(option.estimatedPrice)}</span>
              <span className="text-sm text-muted-foreground">estimated</span>
            </div>
            <p className="text-sm text-muted-foreground">{option.mileagePolicy}</p>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Pros</p>
              <ul className="text-sm space-y-1">
                {option.pros.map((p) => (
                  <li key={p} className="text-emerald-700">+ {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Cons</p>
              <ul className="text-sm space-y-1">
                {option.cons.map((c) => (
                  <li key={c} className="text-muted-foreground">− {c}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm">
              <span className="font-medium">Best for:</span> {option.bestFor}
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              View option
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
