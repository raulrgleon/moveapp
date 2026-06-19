"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmailVerificationFields } from "@/components/auth/email-verification-fields";
import { AuthBrandPanel } from "@/components/brand/auth-brand-panel";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InviteInfo {
  email: string;
  role: string;
  ownerName: string;
  origin: string;
  destination: string;
  accepted: boolean;
}

export default function JoinPage({ params }: { params: { token: string } }) {
  const t = useT();
  const router = useRouter();
  const { register } = useAuth();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registerToken, setRegisterToken] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/move/invite?token=${encodeURIComponent(params.token)}`);
        if (!res.ok) throw new Error("Invalid");
        const data = (await res.json()) as InviteInfo;
        setInfo(data);
        if (data.accepted) {
          router.replace(`/invite/${params.token}`);
        }
      } catch {
        setError(t("invite.invalid"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.token, router, t]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info) return;
    if (password.length < 6) {
      setError(t("auth.passwordMin"));
      return;
    }
    if (!registerToken) {
      setError(t("auth.verifyEmailRequired"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await register({
        email: info.email,
        password,
        name: name.trim() || info.email.split("@")[0],
        inviteToken: params.token,
        registerToken,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registerFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <AuthBrandPanel />
      <div className="flex flex-1 flex-col min-h-screen">
        <header className="flex items-center justify-between p-4 sm:p-6 safe-top lg:hidden">
          <Logo />
          <LanguageToggle showLabel={false} />
        </header>
        <div className="hidden lg:flex items-center justify-end p-6 safe-top">
          <LanguageToggle showLabel={false} />
        </div>
        <div className="flex flex-1 items-center justify-center p-4 sm:p-8 pb-10">
          <Card className="w-full max-w-md shadow-xl border-border/60">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-display">{t("collaboration.joinTitle")}</CardTitle>
              <CardDescription>{t("collaboration.joinSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
              {error && !info && <p className="text-sm text-destructive">{error}</p>}
              {info && (
                <>
                  <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
                    <p>{t("invite.from", { name: info.ownerName })}</p>
                    <p className="font-medium">{info.origin} → {info.destination}</p>
                    <p className="text-muted-foreground">
                      {t("invite.role", { role: info.role })} · {info.email}
                    </p>
                  </div>
                  <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="join-name">{t("settings.fullName")}</Label>
                      <Input
                        id="join-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("onboarding.namePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="join-email">{t("settings.email")}</Label>
                      <Input id="join-email" type="email" value={info.email} disabled />
                    </div>
                    <EmailVerificationFields
                      email={info.email}
                      emailDisabled
                      registerToken={registerToken}
                      onVerified={setRegisterToken}
                      onClearVerification={() => setRegisterToken(null)}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="join-password">{t("login.password")}</Label>
                      <Input
                        id="join-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button className="w-full h-11" type="submit" disabled={submitting}>
                      {submitting ? t("auth.signingIn") : t("collaboration.joinCta")}
                    </Button>
                  </form>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/login?email=${encodeURIComponent(info.email)}`}>
                      {t("login.signIn")}
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
