"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InviteInfo {
  email: string;
  role: string;
  ownerName: string;
  origin: string;
  destination: string;
  accepted: boolean;
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const t = useT();
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/move/invite?token=${encodeURIComponent(params.token)}`);
        if (!res.ok) throw new Error("Invalid");
        setInfo((await res.json()) as InviteInfo);
      } catch {
        setError(t("invite.invalid"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.token, t]);

  const accept = async () => {
    setAccepting(true);
    setError("");
    try {
      const res = await fetch("/api/move/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: params.token }),
      });
      const data = (await res.json()) as { error?: string; needsRegister?: boolean; email?: string };
      if (res.status === 403 && data.needsRegister) {
        setError(t("invite.registerFirst", { email: data.email ?? info?.email ?? "" }));
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("invite.failed"));
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="flex items-center justify-between p-6">
        <Logo />
        <LanguageToggle />
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("invite.title")}</CardTitle>
            <CardDescription>{t("invite.subtitle")}</CardDescription>
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
                {info.accepted ? (
                  <p className="text-sm text-emerald-600">{t("invite.alreadyAccepted")}</p>
                ) : (
                  <Button className="w-full" onClick={accept} disabled={accepting}>
                    {accepting ? t("invite.accepting") : t("invite.accept")}
                  </Button>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">{t("login.signIn")}</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
