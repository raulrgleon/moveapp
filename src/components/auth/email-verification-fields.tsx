"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { useLocale, useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface EmailVerificationFieldsProps {
  email: string;
  onEmailChange?: (email: string) => void;
  emailDisabled?: boolean;
  registerToken: string | null;
  onVerified: (token: string) => void;
  onClearVerification?: () => void;
  className?: string;
}

function parseApiError(
  json: { error?: string; errorKey?: string; waitSec?: number },
  t: (k: string, p?: Record<string, string | number>) => string
) {
  if (json.errorKey === "verificationResendCooldown" && json.waitSec) {
    return t("auth.verifyEmailResendWait", { seconds: json.waitSec });
  }
  const keyMap: Record<string, string> = {
    userExists: "apiErrors.userExists",
    verificationCodeInvalid: "apiErrors.verificationCodeInvalid",
    verificationCodeExpired: "apiErrors.verificationCodeExpired",
    verificationTooManyAttempts: "apiErrors.verificationTooManyAttempts",
    emailRequired: "apiErrors.emailRequired",
    validEmailRequired: "apiErrors.validEmailRequired",
  };
  if (json.errorKey && keyMap[json.errorKey]) {
    return t(keyMap[json.errorKey]);
  }
  return json.error ?? t("auth.registerFailed");
}

export function EmailVerificationFields({
  email,
  onEmailChange,
  emailDisabled = false,
  registerToken,
  onVerified,
  onClearVerification,
  className,
}: EmailVerificationFieldsProps) {
  const t = useT();
  const { locale } = useLocale();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const verified = Boolean(registerToken);

  useEffect(() => {
    setSent(false);
    setCode("");
    setError("");
    onClearVerification?.();
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("apiErrors.emailRequired"));
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, locale }),
      });
      const json = (await res.json()) as {
        error?: string;
        errorKey?: string;
        waitSec?: number;
      };
      if (!res.ok) {
        setError(parseApiError(json, t));
        return;
      }
      setSent(true);
      setError("");
    } catch {
      setError(t("auth.registerFailed"));
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async () => {
    const trimmed = email.trim();
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t("apiErrors.verificationCodeInvalid"));
      return;
    }
    setConfirming(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, code: code.trim() }),
      });
      const json = (await res.json()) as {
        registerToken?: string;
        error?: string;
        errorKey?: string;
      };
      if (!res.ok || !json.registerToken) {
        setError(parseApiError(json, t));
        return;
      }
      onVerified(json.registerToken);
      setError("");
    } catch {
      setError(t("auth.registerFailed"));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className={cn("space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4", className)}>
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="font-medium text-sm">{t("auth.verifyEmailTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("auth.verifyEmailDesc")}</p>
        </div>
      </div>

      {onEmailChange && !emailDisabled ? (
        <div className="space-y-2">
          <Label htmlFor="verify-email">{t("settings.email")}</Label>
          <Input
            id="verify-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={verified}
            required
          />
        </div>
      ) : emailDisabled ? (
        <p className="text-sm">
          <span className="text-muted-foreground">{t("settings.email")}: </span>
          <span className="font-medium">{email}</span>
        </p>
      ) : null}

      {verified ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {t("auth.verifyEmailVerified")}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={sent ? "outline" : "default"}
              size="sm"
              onClick={() => void sendCode()}
              disabled={sending || !email.trim()}
            >
              {sending
                ? t("common.loading")
                : sent
                  ? t("auth.verifyEmailResend")
                  : t("auth.verifyEmailSend")}
            </Button>
            {sent && (
              <span className="text-xs text-muted-foreground self-center">
                {t("auth.verifyEmailSent")}
              </span>
            )}
          </div>

          {sent && (
            <div className="space-y-2">
              <Label htmlFor="verify-code">{t("auth.verifyEmailCodeLabel")}</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="verify-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder={t("auth.verifyEmailCodePlaceholder")}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="sm:max-w-[180px] tracking-widest font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  className="sm:self-end"
                  onClick={() => void confirmCode()}
                  disabled={confirming || code.length !== 6}
                >
                  {confirming ? t("common.loading") : t("auth.verifyEmailConfirm")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
