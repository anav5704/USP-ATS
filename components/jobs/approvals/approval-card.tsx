"use client";

import { Button, Card } from "@heroui/react";
import {
  BanknoteIcon,
  CalendarDaysIcon,
  EyeIcon,
  MapPinIcon,
  UserRoundIcon,
} from "lucide-react";
import { ApprovalStatusBadge } from "@/components/jobs/approvals/approval-status-badge";
import type { ApprovalJob } from "@/lib/jobs/job-schema";

export function ApprovalCard({
  job,
  mine,
  payLabel,
  requestedOn,
  onReview,
}: {
  job: ApprovalJob;
  mine: boolean;
  payLabel: string;
  requestedOn: string;
  onReview: () => void;
}) {
  const requestType =
    job.requestType === "MODIFICATION"
      ? "Modification"
      : job.requestType === "UNARCHIVE"
        ? "Unarchive"
        : "New posting";
  const reviewer = (job.approvedBy ?? job.rejectedBy)?.name;

  return (
    <Card.Root className="min-w-0 rounded-2xl border border-border bg-surface p-4">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-semibold text-foreground">{job.title}</h2>
            <p className="break-words text-sm text-muted">{job.department}</p>
            <p className="mt-1 text-xs font-medium text-muted">{requestType}</p>
          </div>
          <ApprovalStatusBadge job={job} />
        </div>

        <dl className="grid min-w-0 gap-2 text-sm text-muted sm:grid-cols-2">
          <div className="flex min-w-0 items-start gap-2">
            <MapPinIcon className="mt-0.5 size-4 shrink-0" />
            <dd className="min-w-0 break-words">{job.campus.join(", ")}</dd>
          </div>
          <div className="flex items-center gap-2">
            <BanknoteIcon className="size-4 shrink-0" />
            <dd>{payLabel}</dd>
          </div>
          <div className="flex min-w-0 items-start gap-2">
            <UserRoundIcon className="mt-0.5 size-4 shrink-0" />
            <dd className="min-w-0 break-words">
              {(job.requestedBy ?? job.createdBy).name}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="size-4 shrink-0" />
            <dd>{requestedOn}</dd>
          </div>
        </dl>

        {reviewer || job.rejectionReason ? (
          <div className="min-w-0 rounded-xl bg-surface-secondary p-3 text-xs text-muted">
            {reviewer ? <p className="break-words">Reviewed by {reviewer}</p> : null}
            {job.rejectionReason ? (
              <p className="mt-1 whitespace-pre-wrap break-words">{job.rejectionReason}</p>
            ) : null}
          </div>
        ) : null}

        <Button.Root
          variant="ghost"
          onPress={onReview}
          aria-label={`${mine ? "View" : "Review"} ${job.title}`}
          className="w-full rounded-field border border-border text-foreground"
        >
          <EyeIcon className="size-4" />
          {mine ? "View" : "Review"}
        </Button.Root>
      </div>
    </Card.Root>
  );
}
