"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { ChevronDownIcon, ChevronUpIcon, InboxIcon } from "lucide-react";
import type { StudentJobListItem } from "@/lib/jobs/job-schema";
import { JobFeedCard } from "@/components/jobs/job-feed-card";

const PREVIEW_COUNT = 3;

export function JobFeedSection({
  title,
  jobs,
  onJobPress,
}: {
  title: string;
  jobs: StudentJobListItem[];
  onJobPress: (job: StudentJobListItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleJobs = expanded ? jobs : jobs.slice(0, PREVIEW_COUNT);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {jobs.length > PREVIEW_COUNT ? (
          <Button.Root
            onPress={() => setExpanded((value) => !value)}
            className="shrink-0 rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary"
          >
            {expanded ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
            {expanded ? "Show less" : "See all"}
          </Button.Root>
        ) : null}
      </div>
      {visibleJobs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleJobs.map((job) => (
            <JobFeedCard
              key={job.id}
              job={job}
              onPress={() => onJobPress(job)}
            />
          ))}
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
          <InboxIcon className="size-4 shrink-0 text-muted" />
          No matching opportunities available currently.
        </p>
      )}
    </section>
  );
}