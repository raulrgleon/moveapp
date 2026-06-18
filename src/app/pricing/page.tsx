import type { Metadata } from "next";
import { PricingPageContent } from "@/components/marketing/pricing-page-content";

export const metadata: Metadata = {
  title: "Pricing — MovePilotAi",
  description: "Simple pricing for MovePilotAi — plan your move free, upgrade when paid plans launch.",
};

export default function PricingPage() {
  return <PricingPageContent />;
}
