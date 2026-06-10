"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { VehicleListEditor } from "@/components/vehicles/vehicle-list-editor";
import { Logo } from "@/components/layout/logo";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
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

export default function OnboardingPage() {
  const router = useRouter();
  const t = useT();
  const {
    confirmAddress,
    isAddressConfirmed,
    destinationAddress,
    vehicles,
    setVehicles,
  } = useMove();
  const [step, setStep] = useState(1);

  const STEPS = [
    { id: 1, title: t("onboarding.stepMove") },
    { id: 2, title: t("onboarding.stepHousehold") },
    { id: 3, title: t("onboarding.stepVehicles") },
    { id: 4, title: t("onboarding.stepBudget") },
  ];

  const vehiclePreview =
    vehicles.length > 1
      ? vehicles.map((v) => v.displayLabel).join(" + ")
      : `${vehicles[0]?.displayLabel ?? ""} ${t("onboarding.trailerRecommended")}`;

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
              {t("common.back")}
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
            {t("onboarding.stepOf", {
              step,
              total: STEPS.length,
              title: STEPS[step - 1].title,
            })}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{STEPS[step - 1].title}</CardTitle>
            <CardDescription>{t("onboarding.personalize")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="origin">{t("onboarding.origin")}</Label>
                  <Input
                    id="origin"
                    defaultValue="Austin, TX"
                    placeholder={t("onboarding.cityPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">{t("onboarding.destination")}</Label>
                  <Input
                    id="destination"
                    defaultValue="Huntington, WV"
                    placeholder={t("onboarding.cityPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("onboarding.newAddress")}</Label>
                  <AddressAutocomplete
                    onSelect={confirmAddress}
                    initialValue={isAddressConfirmed ? destinationAddress : ""}
                    placeholder={t("onboarding.addressPlaceholder")}
                  />
                  {isAddressConfirmed && (
                    <p className="text-xs text-emerald-600">{t("onboarding.addressSaved")}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moveDate">{t("onboarding.moveDate")}</Label>
                  <Input id="moveDate" type="date" defaultValue="2026-09-15" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="household">{t("onboarding.household")}</Label>
                  <Input
                    id="household"
                    defaultValue="2 adults, 1 child"
                    placeholder={t("onboarding.householdPlaceholder")}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="pets" defaultChecked />
                  <Label htmlFor="pets" className="font-normal">{t("onboarding.pets")}</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petDetails">{t("onboarding.petDetails")}</Label>
                  <Input
                    id="petDetails"
                    defaultValue="1 dog"
                    placeholder={t("onboarding.petPlaceholder")}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>{t("onboarding.yourVehicles")}</Label>
                  <p className="text-xs text-muted-foreground">{t("onboarding.vehiclesHint")}</p>
                  <VehicleListEditor vehicles={vehicles} onChange={setVehicles} showTips />
                </div>
                <div className="space-y-2">
                  <Label>{t("onboarding.rentalPreference")}</Label>
                  <Select defaultValue="trailer">
                    <SelectTrigger>
                      <SelectValue placeholder={t("onboarding.selectOption")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">{t("onboarding.rentTruck")}</SelectItem>
                      <SelectItem value="trailer">{t("onboarding.rentTrailer")}</SelectItem>
                      <SelectItem value="movers">{t("onboarding.hireMovers")}</SelectItem>
                      <SelectItem value="combo">{t("onboarding.trailerCombo")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="vehicleTransport" />
                  <Label htmlFor="vehicleTransport" className="font-normal">
                    {t("onboarding.needTransport")}
                  </Label>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="budget">{t("onboarding.estimatedBudget")}</Label>
                  <Input id="budget" type="number" defaultValue="4000" placeholder="USD" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="housing" defaultChecked />
                  <Label htmlFor="housing" className="font-normal">
                    {t("onboarding.needHousing")}
                  </Label>
                </div>
                <div className="rounded-lg bg-accent/50 p-4 text-sm">
                  <p className="font-medium text-accent-foreground">{t("onboarding.planPreview")}</p>
                  <p className="mt-2 text-muted-foreground">
                    Austin, TX → Huntington, WV · Sep 15, 2026 · $4,000
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    2 adults, 1 child, 1 dog · {vehiclePreview}
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
                {t("common.previous")}
              </Button>
              {step < STEPS.length ? (
                <Button onClick={() => setStep((s) => s + 1)}>
                  {t("common.continue")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete}>
                  {t("onboarding.createPlan")}
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
