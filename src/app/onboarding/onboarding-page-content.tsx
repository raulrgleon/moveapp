"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { CityAutocomplete } from "@/components/address/city-autocomplete";
import {
  parseCityStateLabel,
  type AddressSearchRegion,
} from "@/lib/geo/address-region";
import { MoveDatePicker } from "@/components/onboarding/move-date-picker";
import { VehicleListEditor } from "@/components/vehicles/vehicle-list-editor";
import { AuthBrandPanel } from "@/components/brand/auth-brand-panel";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useAuth } from "@/contexts/auth-context";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { householdWithPets, useMove } from "@/contexts/move-context";
import {
  formatHousehold,
  formatPetDetails,
  rentalPreferenceFromKey,
} from "@/lib/move-profile";
import { useT } from "@/contexts/locale-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatLocalISO, startOfDay } from "@/lib/dates/local-date";
import { useLocale } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const { locale } = useLocale();
  const { register, isAuthenticated, isAdmin, isHydrated: authHydrated } = useAuth();
  const {
    profile,
    updateProfile,
    confirmAddress,
    isAddressConfirmed,
    destinationAddress,
    setVehicles,
    isHydrated: moveHydrated,
    canEditProfile,
  } = useMove();
  const completeMode =
    authHydrated && searchParams.get("complete") === "1" && isAuthenticated;
  const [step, setStep] = useState(1);
  const [onboardingVehicles, setOnboardingVehicles] = useState<VehicleInfo[]>([]);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [destRegion, setDestRegion] = useState<AddressSearchRegion>({});
  const [moveDate, setMoveDate] = useState(profile.moveDate);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [petCount, setPetCount] = useState(0);
  const [rentalKey, setRentalKey] = useState("own");
  const [needsVehicleTransport, setNeedsVehicleTransport] = useState(
    profile.needsVehicleTransport
  );
  const [budget, setBudget] = useState(String(profile.budget));
  const [needsHousingHelp, setNeedsHousingHelp] = useState(profile.needsHousingHelp);
  const [accountName, setAccountName] = useState(profile.name);
  const [accountEmail, setAccountEmail] = useState(profile.email);
  const [accountPassword, setAccountPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [moveDateError, setMoveDateError] = useState("");
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const profileSyncedRef = useRef(false);

  const household = formatHousehold(adults, children);
  const petDetails = formatPetDetails(petCount);
  const pets = petCount > 0;

  const STEPS = [
    { id: 1, title: t("onboarding.stepMove") },
    { id: 2, title: t("onboarding.stepHousehold") },
    { id: 3, title: t("onboarding.stepVehicles") },
    { id: 4, title: t("onboarding.stepBudget") },
    { id: 5, title: t("onboarding.stepSummary") },
    ...(completeMode ? [] : [{ id: 6, title: t("onboarding.stepAccount") }]),
  ];
  const lastStep = STEPS[STEPS.length - 1]?.id ?? 5;
  const currentStepMeta = STEPS[Math.min(step, STEPS.length) - 1] ?? STEPS[0];

  const progressPercent = Math.round((step / STEPS.length) * 100);

  useEffect(() => {
    if (authHydrated && isAdmin) {
      router.replace("/admin");
    }
  }, [authHydrated, isAdmin, router]);

  useEffect(() => {
    if (!moveHydrated || profileSyncedRef.current) return;
    profileSyncedRef.current = true;
    if (profile.origin?.trim()) setOrigin(profile.origin);
    if (profile.destination?.trim()) setDestination(profile.destination);
    if (profile.moveDate) setMoveDate(profile.moveDate);
  }, [moveHydrated, profile.origin, profile.destination, profile.moveDate]);

  useEffect(() => {
    const parsed = parseCityStateLabel(destination);
    setDestRegion((prev) => ({
      ...prev,
      city: parsed.city ?? prev.city,
      state: parsed.state ?? prev.state,
    }));
  }, [destination]);

  const vehiclePreview =
    onboardingVehicles.length === 0
      ? t("onboarding.noVehicleSelected")
      : onboardingVehicles.length > 1
        ? onboardingVehicles
            .map((v) => v.displayLabel)
            .filter(Boolean)
            .join(" + ")
        : onboardingVehicles[0]?.displayLabel || t("onboarding.noVehicleSelected");

  const formatClientError = (message: string) => {
    const key = message.trim().toLowerCase();
    if (key === "forbidden") return t("apiErrors.forbidden");
    if (key === "unauthorized") return t("apiErrors.unauthorized");
    if (key.includes("no move found")) return t("apiErrors.noMove");
    return message || t("onboarding.stepSaveFailed");
  };

  const saveStepData = async (sync = false) => {
    await updateProfile(
      {
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
      },
      false,
      sync
    );
  };

  const handleNext = async () => {
    setStepError("");
    if (step === 1) {
      if (!origin.trim() || !destination.trim()) {
        setStepError(t("onboarding.routeRequired"));
        return;
      }
      const today = formatLocalISO(startOfDay(new Date()));
      if (moveDate < today) {
        setMoveDateError(t("onboarding.moveDatePast"));
        return;
      }
      setMoveDateError("");
    }

    setStepLoading(true);
    try {
      await saveStepData();
      setStep((s) => Math.min(STEPS.length, s + 1));
    } catch (err) {
      setStepError(
        formatClientError(err instanceof Error ? err.message : t("onboarding.stepSaveFailed"))
      );
    } finally {
      setStepLoading(false);
    }
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
        locale,
        profile: fullProfile,
        vehicles: onboardingVehicles.filter((v) => v.make?.trim() && v.model?.trim()),
        destinationAddress: isAddressConfirmed ? destinationAddress : undefined,
        destinationLat: profile.destinationLat,
        destinationLon: profile.destinationLon,
        isAddressConfirmed,
      });
      sessionStorage.setItem("movepilot_celebrate", "1");
      router.push("/dashboard");
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : t("auth.registerFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishSetup = async () => {
    setSubmitting(true);
    setAccountError("");
    try {
      await saveStepData(true);
      setVehicles(onboardingVehicles.filter((v) => v.make?.trim() && v.model?.trim()));
      sessionStorage.setItem("movepilot_celebrate", "1");
      router.push("/dashboard");
    } catch (err) {
      setAccountError(
        formatClientError(err instanceof Error ? err.message : t("apiErrors.saveFailed"))
      );
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

  const setupBlocked =
    completeMode && authHydrated && moveHydrated && isAuthenticated && !canEditProfile;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <AuthBrandPanel />
      <div className="flex flex-1 flex-col min-h-screen min-w-0">
        <header className="border-b bg-background/95 backdrop-blur p-4 sm:p-6 safe-top lg:sticky lg:top-0 lg:z-10">
          <div className="mx-auto max-w-2xl flex items-center justify-between gap-2 min-w-0">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden lg:block flex-1" />
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

        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10 sm:px-6 pb-8 flex-1">
        <div className="mb-8 space-y-4">
          {completeMode && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 text-sm">
                <p className="font-medium">{t("onboarding.oauthCompleteTitle")}</p>
                <p className="text-muted-foreground mt-1">{t("onboarding.oauthCompleteDesc")}</p>
              </CardContent>
            </Card>
          )}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{t("onboarding.progressLabel")}</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
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
              step: Math.min(step, STEPS.length),
              total: STEPS.length,
              title: currentStepMeta.title,
            })}
          </p>
        </div>

        <Card className="shadow-xl border-border/60">
          <CardHeader>
            <CardTitle>{currentStepMeta.title}</CardTitle>
            <CardDescription>{t("onboarding.personalize")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {setupBlocked ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <p>{t("onboarding.noEditPermission")}</p>
                <Button className="mt-4" variant="outline" asChild>
                  <Link href="/dashboard">{t("nav.dashboard")}</Link>
                </Button>
              </div>
            ) : (
              <>
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
                      false,
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
                    setDestRegion({
                      city: city.city ?? parseCityStateLabel(city.label).city,
                      state: city.state ?? parseCityStateLabel(city.label).state,
                      lat: city.lat,
                      lon: city.lon,
                    });
                    void updateProfile(
                      {
                        destination: city.label,
                        destinationLat: city.lat,
                        destinationLon: city.lon,
                      },
                      false,
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
                    region={destRegion}
                  />
                  {isAddressConfirmed && (
                    <p className="text-xs text-emerald-600">{t("onboarding.addressSaved")}</p>
                  )}
                </div>
                <MoveDatePicker
                  label={t("onboarding.moveDate")}
                  value={moveDate}
                  onChange={(v) => {
                    setMoveDate(v);
                    setMoveDateError("");
                  }}
                />
                {moveDateError && (
                  <p className="text-sm text-destructive">{moveDateError}</p>
                )}
                {stepError && step === 1 && (
                  <p className="text-sm text-destructive">{stepError}</p>
                )}
              </>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <NumberStepper
                  label={t("onboarding.adults")}
                  description={t("onboarding.adultsHint")}
                  value={adults}
                  onChange={setAdults}
                  min={0}
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
                    vehicles={onboardingVehicles}
                    onChange={setOnboardingVehicles}
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
                      <SelectItem value="own">{t("onboarding.ownVehicle")}</SelectItem>
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
              </>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("onboarding.summaryDesc")}</p>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
                  <p>
                    <span className="font-medium">{t("onboarding.origin")}:</span> {origin}
                  </p>
                  <p>
                    <span className="font-medium">{t("onboarding.destination")}:</span> {destination}
                  </p>
                  {isAddressConfirmed && (
                    <p>
                      <span className="font-medium">{t("onboarding.newAddress")}:</span>{" "}
                      {destinationAddress}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">{t("onboarding.moveDate")}:</span>{" "}
                    {formatDate(moveDate, locale)}
                  </p>
                  <p>
                    <span className="font-medium">{t("onboarding.household")}:</span>{" "}
                    {householdWithPets(previewProfile)}
                  </p>
                  <p>
                    <span className="font-medium">{t("onboarding.yourVehicles")}:</span> {vehiclePreview}
                  </p>
                  <p>
                    <span className="font-medium">{t("onboarding.rentalPreference")}:</span>{" "}
                    {rentalPreferenceFromKey(rentalKey)}
                  </p>
                  <p>
                    <span className="font-medium">{t("onboarding.estimatedBudget")}:</span>{" "}
                    {formatCurrency(Number(budget) || profile.budget, locale)}
                  </p>
                  {needsHousingHelp && (
                    <p className="text-muted-foreground">{t("onboarding.needHousing")}</p>
                  )}
                  {needsVehicleTransport && (
                    <p className="text-muted-foreground">{t("onboarding.needTransport")}</p>
                  )}
                </div>
              </div>
            )}

            {step === 6 && !completeMode && (
              <>
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
                <Separator />
                <Button variant="outline" className="w-full" asChild>
                  <a href="/api/auth/google">{t("onboarding.continueWithGoogle")}</a>
                </Button>
              </>
            )}

            {completeMode && step === 1 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="font-medium">{t("onboarding.completeSetupTitle")}</p>
                <p className="mt-1 text-muted-foreground">{t("onboarding.completeSetupDesc")}</p>
              </div>
            )}

            {accountError && completeMode && (
              <p className="text-sm text-destructive">{accountError}</p>
            )}

            {stepError && step !== 1 && (
              <p className="text-sm text-destructive">{stepError}</p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1 || stepLoading}
                className="w-full sm:w-auto"
              >
                {t("common.previous")}
              </Button>
              {step < lastStep ? (
                <Button
                  type="button"
                  onClick={() => void handleNext()}
                  disabled={stepLoading || !authHydrated}
                  className="w-full sm:w-auto"
                >
                  {stepLoading ? t("common.saving") : t("common.continue")}
                  {!stepLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={completeMode ? handleFinishSetup : handleComplete}
                  disabled={submitting || !authHydrated}
                  className="w-full sm:w-auto"
                >
                  {submitting
                    ? t("common.saving")
                    : completeMode
                      ? t("onboarding.finishSetup")
                      : t("onboarding.createPlan")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
