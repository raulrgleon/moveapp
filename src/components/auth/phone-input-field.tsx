"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/contexts/locale-context";

type PhoneInputFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export function PhoneInputField({
  id,
  value,
  onChange,
  required = true,
  disabled = false,
}: PhoneInputFieldProps) {
  const t = useT();

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {t("settings.phone")}
        {required ? " *" : ""}
      </Label>
      <Input
        id={id}
        type="tel"
        autoComplete="tel"
        placeholder="+1 555 123 4567"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">{t("settings.phoneHint")}</p>
      <p className="text-xs text-muted-foreground">{t("auth.phoneWhy")}</p>
    </div>
  );
}
