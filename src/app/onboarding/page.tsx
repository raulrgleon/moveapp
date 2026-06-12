"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { CityAutocomplete } from "@/components/address/city-autocomplete";
import { MoveDatePicker } from "@/components/onboarding/move-date-picker";
import { VehicleListEditor } from "@/components/vehicles/vehicle-list-editor";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useAuth } from "@/contexts/auth-context";
import { householdWithPets, useMove } from "@/contexts/move-context";
import { parseHouseholdCounts } from "@/lib/move/household";
import {
  formatHousehold,
  formatPetDetails,
  rentalPreferenceFromKey,
} from "@/lib/move-profile";
import { useT } from "@/contexts/locale-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  const { locale } = useLocale();
  const { register } = useAuth();
  const {
    profile,
    updateProfile,
    confirmAddress,
    isAddressConfirmed,
    destinationAddress,
    vehicles,
    setVehicles,
  } = useMove();
  const [step, setStep] = useState(1);

  const initialCounts = useMemo(() => parseHouseholdCounts(profile), [profile]);

  const [origin, setOrigin] = useState(profile.origin);
  const [destination, setDestination] = useState(profile.destination);
  const [moveDate, setMoveDate] = useState(profile.moveDate);
  const [adults, setAdults] = useState(initialCounts.adults);
  const [children, setChildren] = useState(initialCounts.children);
  const [petCount, setPetCount] = useState(initialCounts.petCount);
  const [rentalKey, setRentalKey] = useState("trailer");
  const [needsVehicleTransport, setNeedsVehicleTransport] = useState(
    profile.needsVehicleTransport
  );
  const [budget, setBudget] = useState(String(profile.budget));
  const [needsHousingHelp, setNeedsHousingHelp] = useState(profile.needsHousingHelp);
  const [accountName, setAccountName] = useState(profile.name);
  const [accountEmail, setAccountEmail] = useState(profile.email);
  const [accountPassword, setAccountPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const household = formatHousehold(adults, children);
  const petDetails = formatPetDetails(petCount);
  const pets = petCount > 0;

  const STEPS = [
    { id: 1, title: t("onboarding.stepMove") },
    { id: 2, title: t("onboarding.stepHousehold") },
    { id: 3, title: t("onboarding.stepVehicles") },
    { id: 4, title: t("onboarding.stepBudget") },
  ];

  const vehiclePreview =
    vehicles.length === 0
      ? t("onboarding.noVehicleSelected")
      : vehicles.length > 1
        ? vehicles
            .map((v) => v.displayLabel)
            .filter(Boolean)
            .join(" + ")
        : vehicles[0]?.displayLabel || t("onboarding.noVehicleSelected");

  const saveStepData = async () => {
    await updateProfile({
      origin,
      destination,
      moveDate,
      household,
      pets,
      petDetails,
      budget: Number(budget) || profile.budget,
      rentalPreference: rentalPreferenceFromKey(rentalKey),
      needsHousingHelp,
      needsVehicleTransport,
    });
  };

  const handleNext = async () => {
    await saveStepData();
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handleComplete = async () => {
    if (!accountEmail.trim() || !accountPassword || accountPassword.length < 6) {
      setAccountError(t("auth.passwordMin"));
      return;
    }
    setSubmitting(true);
    setAccountError("");
    try {
      await saveStepData();
      const fullProfile = {
        ...previewProfile,
        name: accountName.trim() || accountEmail.split("@")[0],
        email: accountEmail.trim(),
        budget: Number(budget) || profile.budget,
        destinationLat: profile.destinationLat,
        destinationLon: profile.destinationLon,
      };
      await register({
        email: accountEmail.trim(),
        password: accountPassword,
        name: fullProfile.name,
        profile: fullProfile,
        vehicles: vehicles.filter((v) => v.make?.trim() && v.model?.trim()),
        destinationAddress: isAddressConfirmed ? destinationAddress : undefined,
        destinationLat: profile.destinationLat,
        destinationLon: profile.destinationLon,
        isAddressConfirmed,
      });
      router.push("/dashboard");
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : t("auth.registerFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const previewProfile = {
    ...profile,
    origin,
    destination,
    moveDate,
    household,
    pets,
    petDetails,
    budget: Number(budget) || profile.budget,
    rentalPreference: rentalPreferenceFromKey(rentalKey),
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background p-4 sm:p-6 safe-top">
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-2 min-w-0">
          <Logo />
          <div className="flex items-center gap-1 shrink-0">
            <LanguageToggle showLabel={false} />
            <Button variant="ghost" size="sm" asChild className="px-2 sm:px-3">
              <Link href="/">
                <ArrowLeft className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t("common.back")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-12 sm:px-6 pb-8">
        <div className="mb-8">
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
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
                  <div className={`h-0.5 w-4 sm:w-8 md:w-16 shrink-0 ${step > s.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
            </div>
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
                <CityAutocomplete
                  id="origin"
                  label={t("onboarding.origin")}
                  value={origin}
                  onChange={setOrigin}
                  onSelect={(city) => {
                    setOrigin(city.label);
                    void updateProfile(
                      { origin: city.label, originLat: city.lat, originLon: city.lon },
                      false
                    );
                  }}
                  placeholder={t("onboarding.cityPlaceholder")}
                />
                <CityAutocomplete
                  id="destination"
                  label={t("onboarding.destination")}
                  value={destination}
                  onChange={setDestination}
                  onSelect={(city) => {
                    setDestination(city.label);
                    void updateProfile(
                      {
                        destination: city.label,
                        destinationLat: city.lat,
                        destinationLon: city.lon,
                      },
                      false
                    );
                  }}
                  placeholder={t("onboarding.cityPlaceholder")}
                />
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
                <MoveDatePicker
                  label={t("onboarding.moveDate")}
                  value={moveDate}
                  onChange={setMoveDate}
                />
              </>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <NumberStepper
                  label={t("onboarding.adults")}
                  description={t("onboarding.adultsHint")}
                  value={adults}
                  onChange={setAdults}
                  min={1}
                  max={20}
                />
                <NumberStepper
                  label={t("onboarding.children")}
                  description={t("onboarding.childrenHint")}
                  value={children}
                  onChange={setChildren}
                  min={0}
                  max={20}
                />
                <NumberStepper
                  label={t("onboarding.petsCount")}
                  description={t("onboarding.petsHint")}
                  value={petCount}
                  onChange={setPetCount}
                  min={0}
                  max={20}
                />
              </div>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>{t("onboarding.yourVehicles")}</Label>
                  <p className="text-xs text-muted-foreground">{t("onboarding.vehiclesHint")}</p>
                  <VehicleListEditor
                    vehicles={vehicles}
                    onChange={setVehicles}
                    showTips
                    allowEmpty
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("onboarding.rentalPreference")}</Label>
                  <Select value={rentalKey} onValueChange={setRentalKey}>
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
                  <Checkbox
                    id="vehicleTransport"
                    checked={needsVehicleTransport}
                    onCheckedChange={(v) => setNeedsVehicleTransport(Boolean(v))}
                  />
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
                  <Input
                    id="budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="USD"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="housing"
                    checked={needsHousingHelp}
                    onCheckedChange={(v) => setNeedsHousingHelp(Boolean(v))}
                  />
                  <Label htmlFor="housing" className="font-normal">
                    {t("onboarding.needHousing")}
                  </Label>
                </div>
                <div className="rounded-lg bg-accent/50 p-4 text-sm">
                  <p className="font-medium text-accent-foreground">{t("onboarding.planPreview")}</p>
                  <p className="mt-2 text-muted-foreground">
                    {origin} → {destination} · {formatDate(moveDate, locale)} ·{" "}
                    {formatCurrency(Number(budget) || profile.budget, locale)}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {householdWithPets(previewProfile)} · {vehiclePreview}
                  </p>
                </div>
                <Separator />
                <p className="font-medium text-sm">{t("onboarding.createAccount")}</p>
                <div className="space-y-2">
                  <Label htmlFor="accountName">{t("settings.fullName")}</Label>
                  <Input
                    id="accountName"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder={t("onboarding.namePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountEmail">{t("settings.email")}</Label>
                  <Input
                    id="accountEmail"
                    type="email"
                    autoComplete="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountPassword">{t("login.password")}</Label>
                  <Input
                    id="accountPassword"
                    type="password"
                    autoComplete="new-password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                {accountError && <p className="text-sm text-destructive">{accountError}</p>}
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="w-full sm:w-auto"
              >
                {t("common.previous")}
              </Button>
              {step < STEPS.length ? (
                <Button onClick={handleNext} className="w-full sm:w-auto">
                  {t("common.continue")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? t("auth.signingIn") : t("onboarding.createPlan")}
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
