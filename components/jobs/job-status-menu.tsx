"use client";

import { Dropdown } from "@heroui/react";
import { ArchiveIcon, ChevronDownIcon, Trash2Icon } from "lucide-react";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";

export function JobStatusMenu({
  job,
  expired,
  onRemove,
}: {
  job: AdminJobListItem;
  expired: boolean;
  onRemove: () => void;
}) {
  if (job.status === "ARCHIVED") {
    return <JobStatusBadge status={job.status} expired={expired} />;
  }

  const willDelete = job.applicationCount === 0;
  const actionLabel = willDelete ? "Delete posting" : "Archive posting";

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={`Change status for ${job.title}`}
        className="inline-flex items-center gap-1 rounded-full transition-opacity hover:opacity-75"
      >
        <JobStatusBadge status={job.status} expired={expired} />
        <ChevronDownIcon className="size-3.5 text-muted" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu>
          <Dropdown.Item
            textValue={actionLabel}
            onAction={onRemove}
            className="flex items-center gap-2 text-danger hover:bg-danger-soft hover:text-danger"
          >
            {willDelete ? (
              <Trash2Icon className="size-4" />
            ) : (
              <ArchiveIcon className="size-4" />
            )}
            {actionLabel}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
