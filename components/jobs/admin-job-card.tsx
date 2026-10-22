"use client";

import Link from "next/link";
import { Button, Card } from "@heroui/react";
import { PencilIcon, UsersRoundIcon } from "lucide-react";
import { JobStatusMenu } from "@/components/jobs/job-status-menu";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";

export function AdminJobCard({
  job,
  payLabel,
  deadlineLabel,
  deadlineTitle,
  onView,
  onEdit,
  onArchive,
  onUnarchive,
  onPrefetchApplicants,
}: {
  job: AdminJobListItem;
  payLabel: string;
  deadlineLabel: string;
  deadlineTitle: string;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onPrefetchApplicants: () => void;
}) {
  return (
    <Card.Root className="min-w-0 rounded-2xl border border-border bg-surface p-4">
      <div className="min-w-0">
        <Button.Root
          variant="ghost"
          onPress={onView}
          aria-label={`View job posting details for ${job.title}`}
          className="h-auto min-w-0 max-w-full justify-start whitespace-normal p-0 text-left text-lg font-semibold text-foreground hover:underline focus-visible:underline"
        >
          <span className="break-words">{job.title}</span>
        </Button.Root>
        <p className="mt-1 break-words text-sm text-muted">
          {job.department} · {job.jobType}
        </p>
      </div>

      <dl className="mt-5 grid min-w-0 grid-cols-2 gap-x-4 gap-y-5">
        <div className="col-span-2 min-w-0">
          <dt className="text-xs font-medium text-muted">Campus/Centre</dt>
          <dd className="mt-1 break-words text-sm text-foreground">
            {job.campus.join(", ")}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted">Pay</dt>
          <dd className="mt-1 break-words text-sm font-medium text-foreground">
            {payLabel}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted">Deadline</dt>
          <dd className="mt-1 break-words text-sm text-foreground" title={deadlineTitle}>
            {deadlineLabel}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted">Applicants</dt>
          <dd className="mt-1">
            <Link
              href={`/admin/jobs/${encodeURIComponent(job.id)}/applicants`}
              onMouseEnter={onPrefetchApplicants}
              onFocus={onPrefetchApplicants}
              aria-label={`View ${job.applicationCount} applicants for ${job.title}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-field pr-3 font-medium text-foreground hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              <UsersRoundIcon className="size-4 shrink-0 text-muted" />
              {job.applicationCount}
            </Link>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted">Status</dt>
          <dd className="mt-1">
            <JobStatusMenu
              job={job}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
              className="min-h-10"
            />
          </dd>
        </div>
      </dl>

      {job.status === "REJECTED" && job.rejectionReason ? (
        <p className="mt-4 whitespace-pre-wrap break-words text-xs text-muted">
          {job.rejectionReason}
        </p>
      ) : null}

      <Button.Root
        variant="ghost"
        onPress={onEdit}
        className="mt-4 min-h-11 w-full gap-2 rounded-field border border-border text-sm font-medium text-foreground hover:bg-surface-secondary"
      >
        <PencilIcon className="size-4" />
        Modify
      </Button.Root>
    </Card.Root>
  );
}
