import type { ApplicationStatus } from "@/lib/applications/application-schema";

export const APPLICATION_STATUS_LABELS = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  WITHDRAWN: "Withdrawn",
} as const;

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const color =
    status === "ACCEPTED"
      ? "bg-success-soft text-success-soft-foreground"
      : status === "DECLINED"
        ? "bg-danger-soft text-danger"
        : status === "WITHDRAWN"
          ? "bg-surface-secondary text-muted"
          : status === "SHORTLISTED"
            ? "bg-surface-secondary text-foreground"
            : "bg-warning-soft text-warning-soft-foreground";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}