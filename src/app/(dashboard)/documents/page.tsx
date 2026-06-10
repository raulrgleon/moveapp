import { FileLock, Upload } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { DocumentStatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENTS } from "@/lib/mock-data";

export default function DocumentsPage() {
  const categories = [...new Set(DOCUMENTS.map((d) => d.category))];
  const verified = DOCUMENTS.filter((d) => d.status === "verified").length;
  const pending = DOCUMENTS.filter((d) => d.status === "pending").length;
  const missing = DOCUMENTS.filter((d) => d.status === "missing").length;

  return (
    <>
      <DashboardHeader title="Documents" description="Secure document vault" />
      <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
        <PageHeader
          title="Documents Center"
          description="Secure vault for all moving-related documents"
          action={
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload document
            </Button>
          }
        />

        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <FileLock className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium text-sm">Encrypted document vault</p>
              <p className="text-xs text-muted-foreground">
                Documents are stored securely. End-to-end encryption coming in production.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{verified}</p>
              <p className="text-sm text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-sky-600">{pending}</p>
              <p className="text-sm text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{missing}</p>
              <p className="text-sm text-muted-foreground">Missing</p>
            </CardContent>
          </Card>
        </div>

        {categories.map((category) => {
          const docs = DOCUMENTS.filter((d) => d.category === category);

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      {doc.uploadedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded {doc.uploadedAt}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{doc.category}</Badge>
                      <DocumentStatusBadge status={doc.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
