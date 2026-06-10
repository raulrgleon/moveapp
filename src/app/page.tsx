import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Map,
  Shield,
  Truck,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Bot,
    title: "AI Moving Plan",
    description: "Week-by-week timeline tailored to your move date, household, and budget.",
  },
  {
    icon: Wallet,
    title: "Smart Budget Planner",
    description: "Track estimated vs. actual costs across every category with savings recommendations.",
  },
  {
    icon: Map,
    title: "Route & City Insights",
    description: "Plan your drive with stops, compare cities, and understand your new home.",
  },
  {
    icon: Truck,
    title: "Truck & Trailer Finder",
    description: "Compare U-Haul, Penske, Budget, and more — find the best option for your move.",
  },
  {
    icon: CheckCircle2,
    title: "Moving Checklist",
    description: "Never miss a task — housing, schools, pets, documents, and packing.",
  },
  {
    icon: Shield,
    title: "Document Vault",
    description: "Secure storage for leases, IDs, insurance, and immigration documents.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo showTagline />
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/onboarding">Start your move</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            AI-powered moving platform
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            Move anywhere with confidence
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-balance">
            MovePilot AI is your co-pilot for every step of your move — from budgeting and route
            planning to checklists, inventory, and document management.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/onboarding">
                Plan my move
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">View demo dashboard</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Free to start · No credit card required
          </p>
        </div>

        <div className="mt-16 rounded-2xl border bg-card shadow-xl overflow-hidden">
          <div className="border-b bg-muted/30 px-6 py-3 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-2 text-xs text-muted-foreground">movepilot.ai/dashboard</span>
          </div>
          <div className="p-6 sm:p-8 bg-gradient-to-br from-background to-muted/20">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Moving route</p>
                  <p className="mt-1 font-semibold">Austin, TX → Huntington, WV</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Estimated budget</p>
                  <p className="mt-1 font-semibold">$4,250</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="mt-1 font-semibold">37% complete</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to move</h2>
            <p className="mt-4 text-muted-foreground">
              One calm, professional dashboard for your entire relocation journey.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-4 text-muted-foreground">
              Tell us about your move. We build your personalized plan in minutes.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "Share your move details", desc: "Origin, destination, date, household, and budget." },
              { step: "2", title: "Get your AI plan", desc: "Timeline, budget breakdown, route, and prioritized tasks." },
              { step: "3", title: "Execute with confidence", desc: "Track progress, compare options, and stay organized." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-primary py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            Ready to plan your move?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Join movers who use MovePilot AI to relocate with less stress.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/onboarding">
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © 2026 MovePilot AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
