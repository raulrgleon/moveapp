import { Suspense } from "react";
import { InventoryPageContent } from "./inventory-page-content";

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <InventoryPageContent />
    </Suspense>
  );
}
