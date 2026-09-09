import type { ApprovalJob } from "@/lib/jobs/job-schema";
import { getApprovalStatus } from "@/lib/jobs/approval-status";

export function ApprovalStatusBadge({ job }: { job: ApprovalJob }) {
  const status = getApprovalStatus(job);
  if (!status) return null;
  const color = status === "Approved" ? "bg-success-soft text-success-soft-foreground"
    : status === "Rejected" ? "bg-danger-soft text-danger"
      : "bg-warning-soft text-warning-soft-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>{status}</span>;
}
