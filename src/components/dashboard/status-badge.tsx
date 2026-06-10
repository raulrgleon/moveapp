import { Badge } from "@/components/ui/badge";
import type { DocumentStatus, TaskPriority, TaskStatus } from "@/lib/types";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const variants: Record<TaskStatus, { label: string; variant: "success" | "info" | "secondary" | "warning" }> = {
    completed: { label: "Completed", variant: "success" },
    in_progress: { label: "In progress", variant: "info" },
    pending: { label: "Pending", variant: "secondary" },
    blocked: { label: "Blocked", variant: "warning" },
  };
  const { label, variant } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const variants: Record<TaskPriority, { label: string; variant: "destructive" | "warning" | "secondary" }> = {
    high: { label: "High", variant: "destructive" },
    medium: { label: "Medium", variant: "warning" },
    low: { label: "Low", variant: "secondary" },
  };
  const { label, variant } = variants[priority];
  return <Badge variant={variant}>{label}</Badge>;
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const variants: Record<DocumentStatus, { label: string; variant: "success" | "info" | "warning" | "destructive" }> = {
    verified: { label: "Verified", variant: "success" },
    pending: { label: "Pending review", variant: "info" },
    expired: { label: "Expired", variant: "warning" },
    missing: { label: "Missing", variant: "destructive" },
  };
  const { label, variant } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}
