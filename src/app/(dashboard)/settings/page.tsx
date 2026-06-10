"use client";

import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { VehicleListEditor } from "@/components/vehicles/vehicle-list-editor";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useMove } from "@/contexts/move-context";
import { useLocale, useT } from "@/contexts/locale-context";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MOCK_USER } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const {
    confirmAddress,
    isAddressConfirmed,
    destinationAddress,
    destination,
    vehicles,
    setVehicles,
  } = useMove();

  return (
    <>
      <DashboardHeader title={t("settings.title")} description={t("settings.subtitle")} />
      <PageContainer className="max-w-3xl">
        <PageHeader title={t("settings.title")} description={t("settings.pageTitle")} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.profile")}</CardTitle>
            <CardDescription>{t("settings.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("settings.fullName")}</Label>
                <Input id="name" defaultValue={MOCK_USER.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("settings.email")}</Label>
                <Input id="email" type="email" defaultValue={MOCK_USER.email} />
              </div>
            </div>
            <Button>{t("settings.saveProfile")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.moveDetails")}</CardTitle>
            <CardDescription>{t("settings.moveDetailsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="origin">{t("settings.movingFrom")}</Label>
                <Input id="origin" defaultValue={MOCK_USER.origin} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">{t("settings.movingTo")}</Label>
                <Input id="destination" defaultValue={destination} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("settings.newHomeAddress")}</Label>
                <AddressAutocomplete
                  onSelect={confirmAddress}
                  initialValue={isAddressConfirmed ? destinationAddress : ""}
                  placeholder={t("address.placeholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moveDate">{t("settings.moveDate")}</Label>
                <Input id="moveDate" type="date" defaultValue={MOCK_USER.moveDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">{t("settings.budget")}</Label>
                <Input id="budget" type="number" defaultValue={MOCK_USER.budget} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.vehiclesSection")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.vehiclesHint")}</p>
              <VehicleListEditor vehicles={vehicles} onChange={setVehicles} showTips={false} />
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
              <p><strong>{t("settings.household")}:</strong> {MOCK_USER.household}</p>
              <p>
                <strong>{t("settings.vehicles")}:</strong>{" "}
                {vehicles.map((v) => v.displayLabel).join(" · ")}
              </p>
              <p><strong>{t("settings.preference")}:</strong> {MOCK_USER.rentalPreference}</p>
              <p><strong>{t("settings.date")}:</strong> {formatDate(MOCK_USER.moveDate)}</p>
              <p><strong>{t("settings.budget")}:</strong> {formatCurrency(MOCK_USER.budget)}</p>
            </div>
            <Button>{t("settings.updateMove")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.notifications")}</CardTitle>
            <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              t("settings.notifTasks"),
              t("settings.notifBudget"),
              t("settings.notifDocs"),
              t("settings.notifAi"),
              t("settings.notifWeekly"),
            ].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm">{item}</span>
                <Button variant="outline" size="sm">{t("common.enabled")}</Button>
              </div>
            ))}
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

        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="w-full sm:w-auto">
            {t("common.export")}
          </Button>
          <Button variant="destructive" className="w-full sm:w-auto">
            {t("common.deleteAccount")}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
