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
import { PageHeader } from "@/components/dashboard/page-header";
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
import { LogoutButton } from "@/components/auth/logout-button";
import { Separator } from "@/components/ui/separator";
import { parseHouseholdCounts } from "@/lib/move/household";
import {
  formatHousehold,
  formatPetDetails,
  parseRentalPreferenceKey,
  rentalPreferenceFromKey,
} from "@/lib/move-profile";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  const [moveDate, setMoveDate] = useState(profile.moveDate);
  const [adults, setAdults] = useState(initialCounts.adults);
  const [children, setChildren] = useState(initialCounts.children);
  const [petCount, setPetCount] = useState(initialCounts.petCount);
  const [rentalKey, setRentalKey] = useState(() => rentalKeyFromProfile(profile.rentalPreference));
  const [needsVehicleTransport, setNeedsVehicleTransport] = useState(profile.needsVehicleTransport);
  const [needsHousingHelp, setNeedsHousingHelp] = useState(profile.needsHousingHelp);
  const [budget, setBudget] = useState(String(profile.budget));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [actionError, setActionError] = useState("");
  const router = useRouter();

  const household = formatHousehold(adults, children);
  const petDetails = formatPetDetails(petCount);
  const pets = petCount > 0;

  const destRegion = useMemo(() => {
    const parsed = parseCityStateLabel(destCity);
    return {
      city: parsed.city,
      state: parsed.state,
      lat: profile.destinationLat,
      lon: profile.destinationLon,
    };
  }, [destCity, profile.destinationLat, profile.destinationLon]);

  const saveProfile = async () => {
    if (!canEditProfile) return;
    setSaving(true);
    try {
      await updateProfile({
        name,
        email,
        origin,
        destination: destCity,
        moveDate,
        household,
        pets,
        petDetails,
        budget: Number(budget) || profile.budget,
        rentalPreference: rentalPreferenceFromKey(rentalKey),
        needsHousingHelp,
        needsVehicleTransport,
      });
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
        <PageHeader title={t("settings.title")} description={t("settings.pageTitle")} />

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
                onSelect={(city) => setOrigin(city.label)}
                placeholder={t("onboarding.cityPlaceholder")}
              />
              <CityAutocomplete
                id="settings-destination"
                label={t("settings.movingTo")}
                value={destCity}
                onChange={setDestCity}
                onSelect={(city) => setDestCity(city.label)}
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
                  type="number"
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
              <p><strong>{t("settings.budget")}:</strong> {formatCurrency(Number(budget) || profile.budget, locale)}</p>
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

        {actionError && <p className="text-sm text-destructive">{actionError}</p>}

        <div className="flex flex-col sm:flex-row gap-4">
          <LogoutButton variant="outline" className="w-full sm:w-auto" />
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              setActionError("");
              try {
                const res = await fetch("/api/user/export", { credentials: "include" });
                if (!res.ok) throw new Error("Export failed");
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `movepilot-export-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                setActionError(t("settings.exportFailed"));
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? t("settings.exporting") : t("common.export")}
          </Button>
        </div>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">{t("common.deleteAccount")}</CardTitle>
            <CardDescription>{t("settings.deleteAccountDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="delete-password">{t("login.password")}</Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <Button
              variant="destructive"
              disabled={deleting || !deletePassword}
              onClick={async () => {
                setDeleting(true);
                setActionError("");
                try {
                  const res = await fetch("/api/user/delete-account", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ password: deletePassword }),
                  });
                  if (!res.ok) {
                    const err = (await res.json().catch(() => ({}))) as { error?: string };
                    throw new Error(err.error ?? "Delete failed");
                  }
                  await logout();
                  router.push("/");
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : t("settings.deleteFailed"));
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
