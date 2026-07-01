"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { validatePhoneForSave } from "@/lib/phone/normalize";
import { PhoneInputField } from "@/components/auth/phone-input-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PHONE_PROMPT_SNOOZE_KEY = "movepilot_phone_prompt_snooze";
const PHONE_PROMPT_SNOOZE_MS = 24 * 60 * 60 * 1000;

export function PhoneCapturePrompt() {
  const t = useT();
  const { user, isAdmin, isImpersonating, isHydrated, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isHydrated || !user || isAdmin || isImpersonating) {
      setOpen(false);
      return;
    }
    const snoozedUntilRaw =
      typeof window !== "undefined" ? window.localStorage.getItem(PHONE_PROMPT_SNOOZE_KEY) : null;
    const snoozedUntil = snoozedUntilRaw ? Number(snoozedUntilRaw) : 0;
    if (Number.isFinite(snoozedUntil) && snoozedUntil > Date.now()) {
      setOpen(false);
      return;
    }
    setOpen(!user.phone?.trim());
  }, [isHydrated, user, isAdmin, isImpersonating]);

  const dismissForNow = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        PHONE_PROMPT_SNOOZE_KEY,
        String(Date.now() + PHONE_PROMPT_SNOOZE_MS)
      );
    }
    setOpen(false);
  };

  const save = async () => {
    setError("");
    const validated = validatePhoneForSave(phone);
    if (!validated.ok) {
      setError(
        validated.reason === "empty" ? t("auth.phoneRequired") : t("auth.phoneInvalid")
      );
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/user/preferences", {
        method: "PATCH",
        body: JSON.stringify({ phone: validated.phone }),
      });
      await refreshUser();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("apiErrors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            {t("auth.phonePromptTitle")}
          </DialogTitle>
          <DialogDescription>{t("auth.phonePromptDesc")}</DialogDescription>
        </DialogHeader>
        <PhoneInputField id="phone-capture" value={phone} onChange={setPhone} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={dismissForNow} disabled={saving}>
            {t("auth.phonePromptLater")}
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving} className="w-full">
            {saving ? t("common.saving") : t("auth.phonePromptSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
