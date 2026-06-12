"use client";

import { useT } from "@/contexts/locale-context";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AssigneeOption {
  email: string;
  name: string;
  role: "owner" | "editor" | "viewer";
}

interface AssigneeSelectProps {
  value: string;
  onChange: (email: string) => void;
  options: AssigneeOption[];
  allowCustom?: boolean;
}

const CUSTOM = "__custom__";
const UNASSIGNED = "__none__";

export function AssigneeSelect({ value, onChange, options, allowCustom = false }: AssigneeSelectProps) {
  const t = useT();

  const known = options.some((o) => o.email.toLowerCase() === value.toLowerCase());
  const selectValue = !value ? UNASSIGNED : known ? value : allowCustom ? CUSTOM : UNASSIGNED;

  if (options.length === 0 && allowCustom) {
    return (
      <Input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("settings.inviteEmailPlaceholder")}
      />
    );
  }

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === UNASSIGNED) onChange("");
          else if (v !== CUSTOM) onChange(v);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("collaboration.selectAssignee")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>{t("collaboration.unassigned")}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.email} value={o.email}>
              {o.name} ({o.role === "owner" ? t("collaboration.roleOwner") : o.role === "viewer" ? t("settings.roleViewer") : t("settings.roleEditor")})
            </SelectItem>
          ))}
          {allowCustom && <SelectItem value={CUSTOM}>{t("collaboration.customEmail")}</SelectItem>}
        </SelectContent>
      </Select>
      {(selectValue === CUSTOM || (value && !known && allowCustom)) && (
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("settings.inviteEmailPlaceholder")}
        />
      )}
    </div>
  );
}
