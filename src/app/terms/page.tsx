import type { Metadata } from "next";
import { TermsPageContent } from "@/components/legal/terms-page-content";

export const metadata: Metadata = {
  title: "Terms of Service — MovePilotAi",
  description: "Terms of Service for MovePilotAi moving planning software.",
};

export default function TermsPage() {
  return <TermsPageContent />;
}
