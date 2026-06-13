import { Suspense } from "react";
import { OnboardingPageContent } from "./onboarding-page-content";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}
