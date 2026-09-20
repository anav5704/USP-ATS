import { RefreshCwIcon } from "lucide-react";
import { ApprovalStatusBadge } from "@/components/jobs/approvals/approval-status-badge";
import { FormField } from "@/components/ui/form-field";
import { JOB_DATE_TIME_ZONE, toFijiDate } from "@/lib/jobs/job-dates";
import type { ApprovalJob } from "@/lib/jobs/job-schema";

const payFormatter = new Intl.NumberFormat("en-FJ", {
  style: "currency",
  currency: "FJD",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-FJ", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: JOB_DATE_TIME_ZONE,
});

type DisplayJob = {
  title: string;
  description: string;
  department: string;
  jobType: string;
  campus: string[];
  gpaMin: number | null;
  degree: string[];
  skills: string[];
  hours: number;
  hourlyPay: number;
  benefit: string;
  deadline: Date | string;
};

function jobFields(job: DisplayJob) {
  return [
    ["Job title", job.title],
    ["Description", job.description],
    ["Department", job.department],
    ["Job type", job.jobType],
    ["Campus/Centre", job.campus.join(", ")],
    ["GPA Required", job.gpaMin === null ? "None" : String(job.gpaMin)],
    ["Qualification requirement", job.degree.join(", ") || "None"],
    ["Skills", job.skills.join(", ") || "None"],
    ["Hours per week", String(job.hours)],
    ["Hourly pay", payFormatter.format(job.hourlyPay)],
    ["Benefit or perk", job.benefit || "None"],
    ["Application deadline", toFijiDate(new Date(job.deadline))],
  ] as const;
}

export function ApprovalDetails({ job }: { job: ApprovalJob }) {
  const proposedFields = jobFields({
    ...job,
    deadline: job.deadline,
    benefit: job.benefit ?? "",
  });
  const previousValues = new Map(
    job.originalJob ? jobFields(job.originalJob) : []
  );
  const reviewer = job.approvedBy ?? job.rejectedBy;
  const reviewDate = job.approvedAt ?? job.rejectedAt;

  return (
    <div className="space-y-5 py-1">
      <div className="flex flex-wrap items-center gap-3">
        <ApprovalStatusBadge job={job} />
        <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-foreground">
          {job.requestType === "MODIFICATION"
            ? "Modification request"
            : "New job request"}
        </span>
      </div>

      {job.requestType === "MODIFICATION" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-secondary p-4">
          <RefreshCwIcon className="mt-0.5 size-4 shrink-0 text-muted" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Proposed changes to an existing posting
            </p>
            <p className="mt-1 text-sm text-muted">
              Changed fields show the currently approved value for comparison.
            </p>
          </div>
        </div>
      ) : null}

      {proposedFields.map(([label, value]) => {
        const previous = previousValues.get(label);
        const changed = previous !== undefined && previous !== value;
        return (
          <FormField key={label} label={label}>
            <div
              className={
                changed
                  ? "rounded-xl border border-warning/30 bg-warning-soft p-3"
                  : undefined
              }
            >
              <p className="whitespace-pre-wrap break-words text-sm text-muted">
                {value}
              </p>
              {changed ? (
                <p className="mt-2 whitespace-pre-wrap break-words text-xs text-muted">
                  Previously: {previous}
                </p>
              ) : null}
            </div>
          </FormField>
        );
      })}

      <FormField label="Created by">
        <p className="text-sm text-muted">
          {job.createdBy.name} ({job.createdBy.email})
        </p>
      </FormField>
      <FormField label="Requested by">
        <p className="text-sm text-muted">
          {(job.requestedBy ?? job.createdBy).name} ({
            (job.requestedBy ?? job.createdBy).email
          })
        </p>
      </FormField>
      <FormField label="Date requested">
        <p className="text-sm text-muted">
          {dateTimeFormatter.format(new Date(job.requestedAt))}
        </p>
      </FormField>
      <FormField label="Reviewed by">
        <p className="text-sm text-muted">
          {reviewer?.name ?? "Not reviewed"}
        </p>
      </FormField>
      <FormField label="Review date">
        <p className="text-sm text-muted">
          {reviewDate
            ? dateTimeFormatter.format(new Date(reviewDate))
            : "Not reviewed"}
        </p>
      </FormField>
      <FormField label="Rejection reason">
        <p className="whitespace-pre-wrap text-sm text-muted">
          {job.rejectionReason || "None"}
        </p>
      </FormField>
    </div>
  );
}
