"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { parseCityStateLabel } from "@/lib/geo/address-region";
import { CityAutocomplete } from "@/components/address/city-autocomplete";
import { VehicleListEditor } from "@/components/vehicles/vehicle-list-editor";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { householdWithPets, useMove } from "@/contexts/move-context";
import { useAuth } from "@/contexts/auth-context";
import { useLocale, useT } from "@/contexts/locale-context";
import { PageContainer } from "@/components/dashboard/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoveDatePicker } from "@/components/onboarding/move-date-picker";
import { NumberStepper } from "@/components/ui/number-stepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PlanSettingsCard } from "@/components/billing/plan-settings-card";
import { ShareMoveCard } from "@/components/settings/share-move-card";
import { ReminderPreferencesCard } from "@/components/settings/reminder-preferences-card";
import { ChangePasswordCard } from "@/components/settings/change-password-card";
import { ActiveMoveSwitcher } from "@/components/settings/active-move-switcher";
import { Separator } from "@/components/ui/separator";
import { parseHouseholdCounts } from "@/lib/move/household";
import {
  formatHousehold,
  formatPetDetails,
  formatBudgetInput,
  parseBudgetInput,
  parseRentalPreferenceKey,
  rentalPreferenceFromKey,
} from "@/lib/move-profile";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

function rentalKeyFromProfile(preference: string): string {
  return parseRentalPreferenceKey(preference);
}

export default function SettingsPage() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { user, logout } = useAuth();
  const {
    profile,
    updateProfile,
    confirmAddress,
    isAddressConfirmed,
    destinationAddress,
    vehicles,
    setVehicles,
    canEditProfile,
    moveRole,
    ownerName,
  } = useMove();

  const initialCounts = useMemo(() => parseHouseholdCounts(profile), [profile]);

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [origin, setOrigin] = useState(profile.origin);
  const [destCity, setDestCity] = useState(profile.destination);
  const [originCoords, setOriginCoords] = useState({
    lat: profile.originLat,
    lon: profile.originLon,
  });
  const [destCoords, setDestCoords] = useState({
    lat: profile.destinationLat,
    lon: profile.destinationLon,
  });
  const [moveDate, setMoveDate] = useState(profile.moveDate);
  const [adults, setAdults] = useState(initialCounts.adults);
  const [children, setChildren] = useState(initialCounts.children);
  const [petCount, setPetCount] = useState(initialCounts.petCount);
  const [rentalKey, setRentalKey] = useState(() => rentalKeyFromProfile(profile.rentalPreference));
  const [needsVehicleTransport, setNeedsVehicleTransport] = useState(profile.needsVehicleTransport);
  const [needsHousingHelp, setNeedsHousingHelp] = useState(profile.needsHousingHelp);
  const [budget, setBudget] = useState(() => formatBudgetInput(profile.budget));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();

  const hasPassword = user?.hasPassword !== false;

  const household = formatHousehold(adults, children);
  const petDetails = formatPetDetails(petCount);
  const pets = petCount > 0;

  const destRegion = useMemo(() => {
    const parsed = parseCityStateLabel(destCity);
    return {
      city: parsed.city,
      state: parsed.state,
      lat: destCoords.lat,
      lon: destCoords.lon,
    };
  }, [destCity, destCoords.lat, destCoords.lon]);

  const saveProfile = async () => {
    if (!canEditProfile) return;
    setSaving(true);
    try {
      await updateProfile(
        {
          name,
          email,
          origin,
          destination: destCity,
          originLat: originCoords.lat,
          originLon: originCoords.lon,
          destinationLat: destCoords.lat,
          destinationLon: destCoords.lon,
          moveDate,
          household,
          pets,
          petDetails,
          budget: parseBudgetInput(budget),
          rentalPreference: rentalPreferenceFromKey(rentalKey),
          needsHousingHelp,
          needsVehicleTransport,
        },
        false
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DashboardHeader title={t("settings.title")} description={t("settings.subtitle")} />
      <PageContainer className="max-w-3xl">
        {saved && (
          <p className="text-sm text-emerald-600 mb-4">{t("common.saved")}</p>
        )}

        <PlanSettingsCard />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.profile")}</CardTitle>
            <CardDescription>{t("settings.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("settings.fullName")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("settings.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.moveDetails")}</CardTitle>
            <CardDescription>{t("settings.moveDetailsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <CityAutocomplete
                id="settings-origin"
                label={t("settings.movingFrom")}
                value={origin}
                onChange={setOrigin}
                onSelect={(city) => {
                  setOrigin(city.label);
                  setOriginCoords({ lat: city.lat, lon: city.lon });
                }}
                placeholder={t("onboarding.cityPlaceholder")}
              />
              <CityAutocomplete
                id="settings-destination"
                label={t("settings.movingTo")}
                value={destCity}
                onChange={setDestCity}
                onSelect={(city) => {
                  setDestCity(city.label);
                  setDestCoords({ lat: city.lat, lon: city.lon });
                }}
                placeholder={t("onboarding.cityPlaceholder")}
              />
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("settings.newHomeAddress")}</Label>
                <AddressAutocomplete
                  onSelect={confirmAddress}
                  initialValue={isAddressConfirmed ? destinationAddress : ""}
                  placeholder={t("address.placeholder")}
                  region={destRegion}
                />
              </div>
              <MoveDatePicker
                label={t("settings.moveDate")}
                value={moveDate}
                onChange={setMoveDate}
              />
              <div className="space-y-2">
                <Label htmlFor="budget">{t("settings.budget")}</Label>
                <Input
                  id="budget"
                  type="text"
                  inputMode="decimal"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("settings.household")}</Label>
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

            <div className="space-y-2">
              <Label>{t("settings.vehiclesSection")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.vehiclesHint")}</p>
              <VehicleListEditor vehicles={vehicles} onChange={setVehicles} showTips={false} />
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

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="housingHelp"
                  checked={needsHousingHelp}
                  onCheckedChange={(v) => setNeedsHousingHelp(Boolean(v))}
                />
                <Label htmlFor="housingHelp" className="font-normal">
                  {t("onboarding.needHousing")}
                </Label>
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
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
              <p><strong>{t("settings.household")}:</strong> {householdWithPets({ ...profile, household, pets, petDetails })}</p>
              <p>
                <strong>{t("settings.vehicles")}:</strong>{" "}
                {vehicles.length
                  ? vehicles.map((v) => v.displayLabel).join(" · ")
                  : t("onboarding.noVehicleSelected")}
              </p>
              <p><strong>{t("settings.preference")}:</strong> {rentalPreferenceFromKey(rentalKey)}</p>
              <p><strong>{t("settings.date")}:</strong> {formatDate(moveDate, locale)}</p>
              <p><strong>{t("settings.budget")}:</strong>{" "}
                {parseBudgetInput(budget) > 0
                  ? formatCurrency(parseBudgetInput(budget), locale)
                  : "—"}
              </p>
              {user && (
                <p><strong>{t("settings.email")}:</strong> {user.email}</p>
              )}
            </div>

            <Button onClick={saveProfile} disabled={saving}>
              {saving ? t("common.loading") : t("settings.updateMove")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.theme")}</CardTitle>
            <CardDescription>{t("settings.themeDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.language")}</CardTitle>
            <CardDescription>{t("settings.languageDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={locale === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLocale("en")}
              >
                {t("settings.english")}
              </Button>
              <Button
                variant={locale === "es" ? "default" : "outline"}
                size="sm"
                onClick={() => setLocale("es")}
              >
                {t("settings.spanish")}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("settings.languageNote")}</p>
          </CardContent>
        </Card>

        <Separator />

        <ChangePasswordCard />

        <ActiveMoveSwitcher />

        {moveRole !== "owner" && (
          <p className="text-sm text-muted-foreground">
            {t("settings.collaboratingAs", { role: moveRole, owner: ownerName })}
          </p>
        )}

        {canEditProfile && (
          <>
            <ShareMoveCard />
            <ReminderPreferencesCard />
          </>
        )}

        <Separator />

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">{t("common.deleteAccount")}</CardTitle>
            <CardDescription>{t("settings.deleteAccountDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasPassword && (
              <p className="text-sm text-muted-foreground">{t("settings.deleteOAuthHint")}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="delete-password">
                {hasPassword ? t("login.password") : t("settings.deleteConfirmEmail")}
              </Label>
              <Input
                id="delete-password"
                type={hasPassword ? "password" : "email"}
                autoComplete={hasPassword ? "current-password" : "email"}
                value={hasPassword ? deletePassword : deleteConfirmEmail}
                onChange={(e) =>
                  hasPassword
                    ? setDeletePassword(e.target.value)
                    : setDeleteConfirmEmail(e.target.value)
                }
              />
            </div>
            {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            <Button
              variant="destructive"
              disabled={
                deleting || (hasPassword ? !deletePassword.trim() : !deleteConfirmEmail.trim())
              }
              onClick={async () => {
                setDeleting(true);
                setDeleteError("");
                try {
                  await apiFetch("/api/user/delete-account", {
                    method: "POST",
                    body: JSON.stringify(
                      hasPassword
                        ? { password: deletePassword }
                        : { confirmEmail: deleteConfirmEmail.trim().toLowerCase() }
                    ),
                  });
                  await logout();
                  router.push("/");
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : t("settings.deleteFailed");
                  setDeleteError(message);
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? t("settings.deleting") : t("common.deleteAccount")}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
