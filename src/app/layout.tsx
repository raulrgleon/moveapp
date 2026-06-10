import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MoveProvider } from "@/contexts/move-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "MovePilot AI — Your AI co-pilot for moving anywhere",
  description:
    "Plan, budget, and execute your move with AI-powered guidance. Route planning, checklists, inventory, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <MoveProvider>{children}</MoveProvider>
      </body>
    </html>
  );
}
