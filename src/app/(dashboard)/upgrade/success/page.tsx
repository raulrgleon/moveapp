import { Suspense } from "react";
import { UpgradeSuccessContent } from "./upgrade-success-content";

export default function UpgradeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <UpgradeSuccessContent />
    </Suspense>
  );
}
