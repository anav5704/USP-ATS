import type { AdminJobListItem } from "@/lib/jobs/job-schema";

export function getApprovalStatus(job: {
  status: AdminJobListItem["status"];
  approvedAt: Date | string | null;
  rejectedAt: Date | string | null;
  requestedById: string | null;
}) {
  if (job.approvedAt || job.status === "ACTIVE") return "Approved";
  if (job.rejectedAt || job.status === "REJECTED") return "Rejected";
  if (job.status === "PENDING_APPROVAL") return "Pending Approval";
  // Legacy postings predate approval metadata; withdrawn requests have a requester.
  if (job.status === "ARCHIVED" && job.requestedById === null) return "Approved";
  return null;
}
