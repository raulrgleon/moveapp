import { Loader2 } from "lucide-react";
import { LoadingText } from "@/components/ui/loading-text";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center page-bottom-pad px-4">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-center">
          <LoadingText messageKey="common.dashboardLoading" />
        </p>
      </div>
    </div>
  );
}
