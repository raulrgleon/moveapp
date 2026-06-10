import { ArrowRight, Building2 } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableScroll } from "@/components/dashboard/table-scroll";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CITY_METRICS, MOCK_USER } from "@/lib/mock-data";

export default function CityComparisonPage() {
  return (
    <>
      <DashboardHeader title="City Comparison" description="Compare origin and destination" />
      <PageContainer>
        <PageHeader
          title="City Comparison"
          description="Understand your new home before you arrive"
        />

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="text-center">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="mt-2 font-semibold text-lg">{MOCK_USER.origin}</p>
                <p className="text-sm text-muted-foreground">Current city</p>
              </div>
              <ArrowRight className="h-6 w-6 text-primary hidden sm:block" />
              <div className="text-center">
                <Building2 className="h-8 w-8 text-primary mx-auto" />
                <p className="mt-2 font-semibold text-lg">{MOCK_USER.destination}</p>
                <p className="text-sm text-muted-foreground">Destination</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Side-by-side metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <TableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>{MOCK_USER.origin}</TableHead>
                  <TableHead>{MOCK_USER.destination}</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CITY_METRICS.map((metric) => (
                  <TableRow key={metric.label}>
                    <TableCell className="font-medium">{metric.label}</TableCell>
                    <TableCell>{metric.originValue}</TableCell>
                    <TableCell>{metric.destinationValue}</TableCell>
                    <TableCell>
                      {metric.trend && (
                        <Badge
                          variant={
                            metric.trend === "better"
                              ? "success"
                              : metric.trend === "worse"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {metric.trend === "better"
                            ? "Better in WV"
                            : metric.trend === "worse"
                              ? "Consider"
                              : "Similar"}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableScroll>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CITY_METRICS.slice(0, 6).map((metric) => (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm">{metric.originValue}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-semibold">{metric.destinationValue}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
