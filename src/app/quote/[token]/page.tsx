"use client";

import { useEffect, useState } from "react";
import { Handshake, Loader2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useLocale, useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LeadSummary {
  origin: string;
  destination: string;
  moveDate: string;
  household: string;
  rentalPreference: string;
  boxCount: number;
  estWeightLbs: number;
  pendingTasks: number;
  budgetEstimate: number;
  pets: boolean;
}

export default function PartnerQuotePage({ params }: { params: { token: string } }) {
  const t = useT();
  const { locale } = useLocale();
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    amount: "",
    message: "",
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
          ...form,
          amount: form.amount ? Number(form.amount) : undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

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
                <CardTitle className="text-base">{t("partnerQuote.moveSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">{t("partnerQuote.route")}:</span>{" "}
                  {summary.origin} → {summary.destination}
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
                  <span className="text-muted-foreground">{t("partnerQuote.inventory")}:</span>{" "}
                  {t("partnerQuote.boxCount", { count: summary.boxCount, weight: summary.estWeightLbs })}
                </p>
                <p>
                  <span className="text-muted-foreground">{t("partnerQuote.budgetEst")}:</span>{" "}
                  {formatCurrency(summary.budgetEstimate, locale)}
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
                    <Label>{t("partnerQuote.quoteAmount")}</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="2500"
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    />
                  </div>
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
