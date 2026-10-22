"use client";

import type { KeyboardEvent } from "react";
import { Card } from "@heroui/react";
import { CalendarDaysIcon, MapPinIcon } from "lucide-react";
import type { ApplicationListItem } from "@/lib/applications/application-schema";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { MetaRow } from "@/components/jobs/job-feed-card";
import { JOB_DATE_TIME_ZONE } from "@/lib/jobs/job-dates";

const dateFormatter = new Intl.DateTimeFormat("en-FJ", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: JOB_DATE_TIME_ZONE,
});

export function ApplicationCard({
  application,
  onPress,
}: {
  application: ApplicationListItem;
  onPress?: () => void;
}) {
  return (
    <Card.Root
      onClick={onPress}
      role={onPress ? "button" : undefined}
      tabIndex={onPress ? 0 : undefined}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (!onPress) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPress();
        }
      }}
      className="h-full cursor-pointer rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:p-5"
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold text-foreground">
              {application.job.title}
            </h2>
            <p className="mt-0.5 break-words text-sm text-muted">{application.job.department}</p>
          </div>
          <ApplicationStatusBadge status={application.status} />
        </div>

        <div className="mt-auto">
          <MetaRow
            items={[
              { icon: MapPinIcon, label: application.job.campus.join(", ") },
              {
                icon: CalendarDaysIcon,
                label: `Applied ${dateFormatter.format(
                  new Date(application.createdAt)
                )}`,
              },
            ]}
          />
        </div>
      </div>
    </Card.Root>
  );
}
