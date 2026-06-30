import type { Metadata, Viewport } from "next";
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
  title: "MovePilotAI — Your AI Co-Pilot For Moving Anywhere",
  description:
    "Moving is stressful. Planning it shouldn't be. MovePilotAI helps families plan, organize, and execute their entire U.S. move — one dashboard, total control.",
  applicationName: "MovePilotAi",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "MovePilotAi" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D9488",
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
