"use client";

import { Dropdown } from "@heroui/react";
import { ArchiveIcon, ChevronDownIcon, RotateCcwIcon } from "lucide-react";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";
import { effectiveJobStatus } from "@/lib/jobs/job-lifecycle";

export function JobStatusMenu({
  job,
  onArchive,
  onUnarchive,
}: {
  job: AdminJobListItem;
  onArchive: () => void;
  onUnarchive: () => void;
}) {
  const status = effectiveJobStatus(job);

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={`Change status for ${job.title}`}
        className="inline-flex items-center gap-1 rounded-full transition-opacity hover:opacity-75"
      >
        <JobStatusBadge status={status} />
        <ChevronDownIcon className="size-3.5 text-muted" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu>
          {status === "ARCHIVED" ? (
            <Dropdown.Item
              textValue="Unarchive posting"
              onAction={onUnarchive}
              className="flex items-center gap-2"
            >
              <RotateCcwIcon className="size-4" />
              Unarchive
            </Dropdown.Item>
          ) : (
            <Dropdown.Item
              textValue="Archive posting"
              onAction={onArchive}
              className="flex items-center gap-2"
            >
              <ArchiveIcon className="size-4" />
              Archive posting
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
