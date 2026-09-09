import type { ApprovalJob } from "@/lib/jobs/job-schema";
import { FormField } from "@/components/ui/form-field";
import { ApprovalStatusBadge } from "@/components/jobs/approvals/approval-status-badge";
import { JOB_DATE_TIME_ZONE } from "@/lib/jobs/job-dates";

export function ApprovalDetails({ job }: { job: ApprovalJob }) {
  const fields = [
    ["Job title", job.title],
    ["Description", job.description],
    ["Department", job.department],
    ["Job type", job.jobType],
    ["Campus/Centre", job.campus.join(", ")],
    ["GPA Required", job.gpaMin === null ? "None" : String(job.gpaMin)],
    ["Qualification requirement", job.degree.join(", ") || "None"],
    ["Skills", job.skills.join(", ") || "None"],
    ["Hours per week", job.hours == null ? "Not specified" : String(job.hours)],
    ["Hourly pay", new Intl.NumberFormat("en-FJ", { style: "currency", currency: "FJD" }).format(job.hourlyPay)],
    ["Benefit or perk", job.benefit || "None"],
    ["Application deadline", new Date(job.deadline).toLocaleString("en-FJ", { timeZone: JOB_DATE_TIME_ZONE })],
    ["Created by", `${job.createdBy.name} (${job.createdBy.email})`],
    ["Requested by", `${(job.requestedBy ?? job.createdBy).name} (${(job.requestedBy ?? job.createdBy).email})`],
    ["Date requested", new Date(job.requestedAt).toLocaleString("en-FJ", { timeZone: JOB_DATE_TIME_ZONE })],
    ["Reviewed by", (job.approvedBy ?? job.rejectedBy)?.name ?? "Not reviewed"],
    ["Review date", job.approvedAt || job.rejectedAt ? new Date((job.approvedAt ?? job.rejectedAt)!).toLocaleString("en-FJ", { timeZone: JOB_DATE_TIME_ZONE }) : "Not reviewed"],
    ["Rejection reason", job.rejectionReason || "None"],
  ];
  return <div className="space-y-5 py-1">
    <FormField label="Approval status"><ApprovalStatusBadge job={job} /></FormField>
    {fields.map(([label, value]) => <FormField key={label} label={label}>
      <p className="whitespace-pre-wrap break-words text-sm text-muted">{value}</p>
    </FormField>)}
  </div>;
}
