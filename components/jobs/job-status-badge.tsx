import type { AdminJobListItem } from "@/lib/jobs/job-schema";

export const JOB_STATUS_LABELS = {
  PENDING_APPROVAL: "Pending Approval",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
} as const;

export function JobStatusBadge({ status }: {
  status: AdminJobListItem["status"];
}) {
  const color = status === "PENDING_APPROVAL"
    ? "bg-warning-soft text-warning-soft-foreground"
    : status === "ACTIVE" ? "bg-success-soft text-success-soft-foreground"
      : status === "REJECTED" ? "bg-danger-soft text-danger"
        : "bg-surface-secondary text-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
    {JOB_STATUS_LABELS[status]}
  </span>;
}
