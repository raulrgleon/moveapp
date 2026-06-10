"use client";

import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useMove } from "@/contexts/move-context";
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
  const { confirmAddress, isAddressConfirmed, destinationAddress, destination } = useMove();

  return (
    <>
      <DashboardHeader title="Settings" description="Manage your account and move profile" />
      <PageContainer className="max-w-3xl">
        <PageHeader title="Settings" description="Account and move preferences" />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" defaultValue={MOCK_USER.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={MOCK_USER.email} />
              </div>
            </div>
            <Button>Save profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Move details</CardTitle>
            <CardDescription>Update your relocation information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="origin">Moving from</Label>
                <Input id="origin" defaultValue={MOCK_USER.origin} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Moving to</Label>
                <Input id="destination" defaultValue={MOCK_USER.destination} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>New home address</Label>
                <AddressAutocomplete
                  onSelect={confirmAddress}
                  initialValue={isAddressConfirmed ? destinationAddress : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moveDate">Move date</Label>
                <Input id="moveDate" type="date" defaultValue={MOCK_USER.moveDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input id="budget" type="number" defaultValue={MOCK_USER.budget} />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
              <p><strong>Household:</strong> {MOCK_USER.household}</p>
              <p><strong>Vehicle:</strong> {MOCK_USER.vehicles[0]}</p>
              <p><strong>Preference:</strong> {MOCK_USER.rentalPreference}</p>
              <p><strong>Move date:</strong> {formatDate(MOCK_USER.moveDate)}</p>
              <p><strong>Budget:</strong> {formatCurrency(MOCK_USER.budget)}</p>
            </div>
            <Button>Update move details</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Email and alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Task deadline reminders",
              "Budget alerts",
              "Document expiration warnings",
              "AI plan updates",
              "Weekly progress summary",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm">{item}</span>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Language</CardTitle>
            <CardDescription>App display language (i18n-ready)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="default" size="sm">English</Button>
              <Button variant="outline" size="sm">Español</Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Spanish localization coming soon. Structure is i18n-ready.
            </p>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="w-full sm:w-auto">Export all data</Button>
          <Button variant="destructive" className="w-full sm:w-auto">Delete account</Button>
        </div>
      </PageContainer>
    </>
  );
}
