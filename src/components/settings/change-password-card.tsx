"use client";

import { useState } from "react";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordCard() {
  const t = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await apiFetch("/api/user/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.passwordChangeFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("settings.changePassword")}</CardTitle>
        <CardDescription>{t("settings.changePasswordDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">{t("settings.currentPassword")}</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">{t("settings.newPassword")}</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t("settings.confirmPassword")}</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{t("settings.passwordChanged")}</p>}
        <Button
          onClick={submit}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
        >
          {loading ? t("common.saving") : t("settings.changePassword")}
        </Button>
      </CardContent>
    </Card>
  );
}
