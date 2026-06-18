import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { PlausibleScript } from "@/components/analytics/plausible-script";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MovePilotAi — Your AI co-pilot for moving anywhere",
  description:
    "Plan, budget, and execute your move with MovePilotAi. Smart checklists, route planning, inventory, documents, and your AI co-pilot Pilot.",
  applicationName: "MovePilotAi",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "MovePilotAi" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${display.variable} font-sans antialiased`}>
        <PlausibleScript />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
