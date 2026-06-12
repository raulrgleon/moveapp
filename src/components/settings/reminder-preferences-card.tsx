"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export function ReminderPreferencesCard() {
  const t = useT();
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [emailReminders, setEmailReminders] = useState(true);
  const [smsReminders, setSmsReminders] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPhone(user.phone ?? "");
      setEmailReminders(user.emailReminders ?? true);
      setSmsReminders(user.smsReminders ?? false);
    }
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/user/preferences", {
        method: "PATCH",
        body: JSON.stringify({ phone, emailReminders, smsReminders }),
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("settings.notifications")}</CardTitle>
        <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="emailReminders"
            checked={emailReminders}
            onCheckedChange={(v) => setEmailReminders(Boolean(v))}
          />
          <div>
            <Label htmlFor="emailReminders" className="font-normal">{t("settings.emailReminders")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.emailRemindersDesc")}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="smsReminders"
            checked={smsReminders}
            onCheckedChange={(v) => setSmsReminders(Boolean(v))}
          />
          <div>
            <Label htmlFor="smsReminders" className="font-normal">{t("settings.smsReminders")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.smsRemindersDesc")}</p>
          </div>
        </div>
        {smsReminders && (
          <div className="space-y-2">
            <Label htmlFor="phone">{t("settings.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}
        {saved && <p className="text-sm text-emerald-600">{t("common.saved")}</p>}
        <Button onClick={save} disabled={saving}>
          {saving ? t("common.saving") : t("settings.saveNotifications")}
        </Button>
      </CardContent>
    </Card>
  );
}
