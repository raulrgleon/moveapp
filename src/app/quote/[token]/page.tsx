"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Handshake, Loader2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useLocale, useT } from "@/contexts/locale-context";
import { complexityLabel, serviceTypeLabel } from "@/lib/partner/move-brief";
import type { MoveBrief, MoveComplexityLevel } from "@/lib/partner/move-brief";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LeadSummary extends Omit<MoveBrief, "vehicles"> {
  vehicleLabels: string[];
  pendingTasks: number;
  budgetEstimate: number;
  serviceTypes: string[];
}

export default function PartnerQuotePage({ params }: { params: { token: string } }) {
  const t = useT();
  const { locale } = useLocale();
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quoteMode, setQuoteMode] = useState<"fixed" | "range">("fixed");
  const [form, setForm] = useState({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    amount: "",
    amountMin: "",
    amountMax: "",
    message: "",
    serviceType: "full_service",
    includesPacking: false,
    includesInsurance: false,
    usdotNumber: "",
    availableDate: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/partner/quote/${params.token}`);
        if (!res.ok) throw new Error("invalid");
        setSummary((await res.json()) as LeadSummary);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/partner/quote/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone || undefined,
          message: form.message || undefined,
          serviceType: form.serviceType,
          includesPacking: form.includesPacking,
          includesInsurance: form.includesInsurance,
          usdotNumber: form.usdotNumber || undefined,
          availableDate: form.availableDate || undefined,
          amount:
            quoteMode === "fixed" && form.amount ? Number(form.amount) : undefined,
          amountMin:
            quoteMode === "range" && form.amountMin ? Number(form.amountMin) : undefined,
          amountMax:
            quoteMode === "range" && form.amountMax ? Number(form.amountMax) : undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const complexityVariant = (level: MoveComplexityLevel) =>
    level === "complex" ? "destructive" : level === "moderate" ? "secondary" : "outline";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4 flex items-center justify-between">
        <Logo />
        <LanguageToggle showLabel={false} />
      </header>

      <main className="mx-auto max-w-lg px-4 py-10 space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.loading")}
          </div>
        ) : error || !summary ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {t("partnerQuote.invalidLink")}
            </CardContent>
          </Card>
        ) : submitted ? (
          <Card className="border-primary/30">
            <CardContent className="p-6 text-center space-y-3">
              <Handshake className="h-10 w-10 text-primary mx-auto" />
              <p className="font-medium">{t("partnerQuote.thankYou")}</p>
              <p className="text-sm text-muted-foreground">{t("partnerQuote.thankYouDesc")}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold">{t("partnerQuote.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("partnerQuote.subtitle")}</p>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{t("partnerQuote.moveSummary")}</CardTitle>
                  <Badge variant={complexityVariant(summary.complexity)}>
                    {complexityLabel(summary.complexity, locale)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">{t("partnerQuote.route")}:</span>{" "}
                  {summary.origin} → {summary.destination}
                  {summary.distanceMiles != null && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {summary.distanceMiles.toLocaleString()} mi
                    </span>
                  )}
                </p>
                <p>
                  <span className="text-muted-foreground">{t("partnerQuote.date")}:</span>{" "}
                  {formatDate(summary.moveDate, locale)}
                </p>
                <p>
                  <span className="text-muted-foreground">{t("partnerQuote.household")}:</span>{" "}
                  {summary.household}
                  {summary.pets ? ` · ${t("partnerQuote.pets")}` : ""}
                </p>
                <p>
                  <span className="text-muted-foreground">{t("partnerQuote.preference")}:</span>{" "}
                  {summary.rentalPreferenceLabel}
                </p>
                <p>
                  <span className="text-muted-foreground">{t("partnerQuote.inventory")}:</span>{" "}
                  {t("partnerQuote.boxCount", { count: summary.boxCount, weight: summary.estWeightLbs })}
                  {summary.fragileCount > 0 &&
                    ` · ${t("partnerPage.fragileCount", { count: summary.fragileCount })}`}
                </p>
                {summary.vehicleLabels.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">{t("partnerQuote.vehicles")}:</span>{" "}
                    {summary.vehicleLabels.join(", ")}
                  </p>
                )}
                {summary.fuelEstimate != null && summary.fuelEstimate > 0 && (
                  <p>
                    <span className="text-muted-foreground">{t("partnerQuote.clientFuelEst")}:</span>{" "}
                    {formatCurrency(summary.fuelEstimate, locale)}
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">{t("partnerQuote.budgetEst")}:</span>{" "}
                  {formatCurrency(summary.budgetEstimate, locale)}
                </p>
                <p className="text-xs text-muted-foreground flex items-start gap-1 pt-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {t("partnerQuote.privacyNote")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("partnerQuote.submitQuote")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("partnerQuote.companyName")}</Label>
                    <Input
                      required
                      value={form.companyName}
                      onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("partnerQuote.contactEmail")}</Label>
                    <Input
                      type="email"
                      required
                      value={form.contactEmail}
                      onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("partnerQuote.contactPhone")}</Label>
                    <Input
                      value={form.contactPhone}
                      onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("partnerQuote.usdotNumber")}</Label>
                    <Input
                      placeholder="1234567"
                      value={form.usdotNumber}
                      onChange={(e) => setForm((p) => ({ ...p, usdotNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("partnerQuote.serviceType")}</Label>
                    <Select
                      value={form.serviceType}
                      onValueChange={(v) => setForm((p) => ({ ...p, serviceType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {summary.serviceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {serviceTypeLabel(type, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.includesPacking}
                        onCheckedChange={(v) =>
                          setForm((p) => ({ ...p, includesPacking: v === true }))
                        }
                      />
                      {t("partnerQuote.includesPacking")}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.includesInsurance}
                        onCheckedChange={(v) =>
                          setForm((p) => ({ ...p, includesInsurance: v === true }))
                        }
                      />
                      {t("partnerQuote.includesInsurance")}
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("partnerQuote.availableDate")}</Label>
                    <Input
                      type="date"
                      value={form.availableDate}
                      onChange={(e) => setForm((p) => ({ ...p, availableDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={quoteMode === "fixed" ? "default" : "outline"}
                      onClick={() => setQuoteMode("fixed")}
                    >
                      {t("partnerQuote.fixedPrice")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={quoteMode === "range" ? "default" : "outline"}
                      onClick={() => setQuoteMode("range")}
                    >
                      {t("partnerQuote.priceRange")}
                    </Button>
                  </div>
                  {quoteMode === "fixed" ? (
                    <div className="space-y-2">
                      <Label>{t("partnerQuote.quoteAmount")}</Label>
                      <Input
                        type="number"
                        min={0}
                        required
                        placeholder="2500"
                        value={form.amount}
                        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{t("partnerQuote.amountMin")}</Label>
                        <Input
                          type="number"
                          min={0}
                          required
                          value={form.amountMin}
                          onChange={(e) => setForm((p) => ({ ...p, amountMin: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("partnerQuote.amountMax")}</Label>
                        <Input
                          type="number"
                          min={0}
                          required
                          value={form.amountMax}
                          onChange={(e) => setForm((p) => ({ ...p, amountMax: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>{t("partnerQuote.message")}</Label>
                    <Textarea
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? t("common.saving") : t("partnerQuote.sendQuote")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              {t("partnerQuote.poweredBy")}{" "}
              <Link href="/" className="text-primary hover:underline">
                MovePilotAi
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
