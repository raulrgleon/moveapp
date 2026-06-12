"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "oauth") {
      setError(t("auth.oauthNotConfigured"));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError(t("auth.signInRequired"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(identifier.trim(), password);
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const me = meRes.ok ? ((await meRes.json()) as { user?: { role?: string } }) : {};
      router.push(me.user?.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">{t("login.identifier")}</Label>
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="you@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                {t("login.forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? t("auth.signingIn") : t("login.signIn")}
          </Button>
        </form>
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            {t("common.or")}
          </span>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <a href="/api/auth/google">{t("login.google")}</a>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link href="/onboarding" className="text-primary font-medium hover:underline">
            {t("login.startMove")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const t = useT();

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="flex items-center justify-between p-4 sm:p-6 safe-top">
        <Logo />
        <LanguageToggle showLabel={false} />
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <Suspense
          fallback={
            <Card className="w-full max-w-md shadow-lg">
              <CardContent className="py-12 text-center text-muted-foreground">
                {t("common.loading")}
              </CardContent>
            </Card>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
