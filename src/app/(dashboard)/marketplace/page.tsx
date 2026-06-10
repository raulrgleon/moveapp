import { ExternalLink, Star } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MARKETPLACE_SERVICES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Movers",
  "Truck rentals",
  "Storage",
  "Internet providers",
  "Insurance",
  "Cleaning",
  "Handyman",
  "Pet boarding",
  "Hotels",
];

export default function MarketplacePage() {
  return (
    <>
      <DashboardHeader title="Marketplace" description="Recommended services for your move" />
      <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
        <PageHeader
          title="Services Marketplace"
          description="Curated providers for your Austin → Huntington move"
        />

        <Tabs defaultValue="All">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {MARKETPLACE_SERVICES
                  .filter((s) => cat === "All" || s.category === cat)
                  .map((service) => (
                    <Card key={service.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{service.provider}</CardTitle>
                          <Badge variant="outline">{service.category}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{service.rating}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <p className="mt-4 text-lg font-semibold">
                          {formatCurrency(service.estimatedPrice)}
                          <span className="text-sm font-normal text-muted-foreground">
                            {service.category === "Internet providers" ? "/mo" : " est."}
                          </span>
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">
                          View provider
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
