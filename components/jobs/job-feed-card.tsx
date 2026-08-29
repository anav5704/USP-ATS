"use client";

import type { KeyboardEvent } from "react";
import { Card } from "@heroui/react";
import {
  BanknoteIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
} from "lucide-react";
import type { StudentJobListItem } from "@/lib/jobs/job-schema";
import {
  JOB_DATE_TIME_ZONE,
  deadlineRemainingLabel,
} from "@/lib/jobs/job-dates";

const dateFormatter = new Intl.DateTimeFormat("en-FJ", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: JOB_DATE_TIME_ZONE,
});

const payFormatter = new Intl.NumberFormat("en-FJ", {
  style: "currency",
  currency: "FJD",
});

type MetaItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  title?: string;
};

export function MetaRow({ items }: { items: MetaItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map(({ icon: Icon, label, title }, index) => (
        <span
          key={index}
          title={title}
          className="flex items-center gap-2 text-sm text-muted"
        >
          <Icon className="size-4 shrink-0 text-muted" />
          {label}
        </span>
      ))}
    </div>
  );
}

export function RequirementChips({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function JobFeedCard({
  job,
  onPress,
}: {
  job: StudentJobListItem;
  onPress?: () => void;
}) {
  const deadline = dateFormatter.format(new Date(job.deadline));
  const camps = job.campus.join(", ");
  const deadlineStatus = deadlineRemainingLabel(new Date(job.deadline));

  const meta: MetaItem[] = [
    { icon: MapPinIcon, label: camps },
    {
      icon: ClockIcon,
      label: job.hours !== null ? `${job.hours} hrs/week` : "Hours not specified",
    },
    {
      icon: BanknoteIcon,
      label:
        job.hourlyPay > 0
          ? `${payFormatter.format(job.hourlyPay)}/hr`
          : "Unpaid",
    },
    deadlineStatus.expired
      ? {
          icon: CalendarDaysIcon,
          label: deadlineStatus.label,
          title: deadline,
        }
      : {
          icon: CalendarDaysIcon,
          label: (
            <span
              className={
                deadlineStatus.label === "Closes today"
                  ? "font-medium text-warning"
                  : undefined
              }
            >
              {deadlineStatus.label}
            </span>
          ),
          title: deadline,
        },
  ];

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
      className="h-full cursor-pointer rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div className="flex h-full flex-col gap-3">
        <div>
          <span className="inline-block rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
            {job.jobType}
          </span>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            {job.title}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{job.department}</p>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {job.description}
        </p>

        <div className="mt-auto">
          <MetaRow items={meta} />
        </div>
      </div>
    </Card.Root>
  );
}