"use client";

import type { KeyboardEvent } from "react";
import { Card } from "@heroui/react";
import {
  BanknoteIcon,
  CalendarDaysIcon,
  ClockIcon,
  GraduationCapIcon,
  MapPinIcon,
} from "lucide-react";
import type { StudentJobListItem } from "@/lib/jobs/job-schema";
import { JOB_DATE_TIME_ZONE } from "@/lib/jobs/job-dates";

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
  label: string;
};

export function MetaRow({ items }: { items: MetaItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map(({ icon: Icon, label }, index) => (
        <span
          key={index}
          className="flex items-center gap-1.5 text-xs text-zinc-600"
        >
          <Icon className="size-3.5 text-zinc-400" />
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
          className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"
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
      className="h-full cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <div className="flex h-full flex-col gap-3">
        <div>
          <span className="inline-block rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
            {job.jobType}
          </span>
          <h2 className="mt-2 text-base font-semibold text-zinc-900">
            {job.title}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">{job.department}</p>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">
          {job.description}
        </p>

        <MetaRow
          items={[
            job.hours !== null
              ? { icon: ClockIcon, label: `${job.hours} hrs/week` }
              : { icon: ClockIcon, label: "Hours not specified" },
            { icon: MapPinIcon, label: camps },
            job.hourlyPay > 0
              ? { icon: BanknoteIcon, label: `${payFormatter.format(job.hourlyPay)}/hr` }
              : { icon: BanknoteIcon, label: "Unpaid" },
            { icon: CalendarDaysIcon, label: `Deadline ${deadline}` },
          ]}
        />

        <div className="mt-auto space-y-2 border-t border-zinc-100 pt-3">
          {job.gpaMin !== null ? (
            <p className="flex items-center gap-1.5 text-xs text-zinc-600">
              <GraduationCapIcon className="size-3.5 text-zinc-400" />
              Minimum GPA: {job.gpaMin.toFixed(2)}
            </p>
          ) : null}
          {job.degree.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-500">
                Degree requirements
              </p>
              <RequirementChips items={job.degree} />
            </div>
          ) : null}
          {job.skills.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-500">Skills</p>
              <RequirementChips items={job.skills} />
            </div>
          ) : null}
        </div>
      </div>
    </Card.Root>
  );
}
