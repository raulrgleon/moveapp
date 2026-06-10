"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STEPS = [
  { id: 1, title: "Move details" },
  { id: 2, title: "Household" },
  { id: 3, title: "Vehicles & logistics" },
  { id: 4, title: "Budget & needs" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleComplete = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step > s.id
                      ? "bg-primary text-primary-foreground"
                      : step === s.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-16 ${step > s.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Step {step} of {STEPS.length}: {STEPS[step - 1].title}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{STEPS[step - 1].title}</CardTitle>
            <CardDescription>
              Help us personalize your moving plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="origin">Where are you moving from?</Label>
                  <Input id="origin" defaultValue="Austin, TX" placeholder="City, State" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Where are you moving to?</Label>
                  <Input id="destination" defaultValue="Huntington, WV" placeholder="City, State" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moveDate">What is your moving date?</Label>
                  <Input id="moveDate" type="date" defaultValue="2026-09-15" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="household">How many people are moving?</Label>
                  <Input id="household" defaultValue="2 adults, 1 child" placeholder="e.g. 2 adults, 1 child" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="pets" defaultChecked />
                  <Label htmlFor="pets" className="font-normal">Do you have pets?</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petDetails">Pet details (optional)</Label>
                  <Input id="petDetails" defaultValue="1 dog" placeholder="e.g. 1 dog, 2 cats" />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="vehicles">What vehicles do you own?</Label>
                  <Input
                    id="vehicles"
                    defaultValue="2019 Volkswagen Atlas V6 4Motion"
                    placeholder="Make, model, year"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rental preference</Label>
                  <Select defaultValue="trailer">
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">Rent a truck</SelectItem>
                      <SelectItem value="trailer">Rent a trailer</SelectItem>
                      <SelectItem value="movers">Hire movers</SelectItem>
                      <SelectItem value="combo">Trailer + own vehicle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="vehicleTransport" />
                  <Label htmlFor="vehicleTransport" className="font-normal">
                    Do you need help transporting a vehicle?
                  </Label>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="budget">What is your estimated budget?</Label>
                  <Input id="budget" type="number" defaultValue="4000" placeholder="USD" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="housing" defaultChecked />
                  <Label htmlFor="housing" className="font-normal">
                    Do you need help finding housing?
                  </Label>
                </div>
                <div className="rounded-lg bg-accent/50 p-4 text-sm">
                  <p className="font-medium text-accent-foreground">Your plan preview</p>
                  <p className="mt-2 text-muted-foreground">
                    Austin, TX → Huntington, WV · Sep 15, 2026 · $4,000 budget
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    2 adults, 1 child, 1 dog · VW Atlas + trailer recommended
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
              >
                Previous
              </Button>
              {step < STEPS.length ? (
                <Button onClick={() => setStep((s) => s + 1)}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete}>
                  Create my plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
