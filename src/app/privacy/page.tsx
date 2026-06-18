import type { Metadata } from "next";
import { PrivacyPageContent } from "@/components/legal/privacy-page-content";

export const metadata: Metadata = {
  title: "Privacy Policy — MovePilotAi",
  description: "Privacy Policy for MovePilotAi moving planning software.",
};

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
