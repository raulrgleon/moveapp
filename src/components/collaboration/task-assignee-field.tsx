"use client";

import { AssigneeSelect } from "@/components/collaboration/assignee-select";
import { useMoveTeam } from "@/hooks/use-move-team";
import { useT } from "@/contexts/locale-context";
import { Label } from "@/components/ui/label";

interface TaskAssigneeFieldProps {
  value: string;
  onChange: (email: string) => void;
}

export function TaskAssigneeField({ value, onChange }: TaskAssigneeFieldProps) {
  const t = useT();
  const { assigneeOptions } = useMoveTeam();

  return (
    <div className="space-y-2">
      <Label>{t("checklistPage.taskAssignee")}</Label>
      <AssigneeSelect
        value={value}
        onChange={onChange}
        options={assigneeOptions}
        allowCustom
      />
      <p className="text-xs text-muted-foreground">{t("collaboration.assigneeHint")}</p>
    </div>
  );
}
