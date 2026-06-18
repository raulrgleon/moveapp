import type { Metadata } from "next";
import { RefundsPageContent } from "@/components/legal/refunds-page-content";

export const metadata: Metadata = {
  title: "Refund Policy — MovePilotAi",
  description: "Refund Policy for MovePilotAi Pro purchases.",
};

export default function RefundsPage() {
  return <RefundsPageContent />;
}
