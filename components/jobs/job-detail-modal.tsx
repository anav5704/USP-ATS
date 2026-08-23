"use client";

import { Button, Modal } from "@heroui/react";
import {
  BanknoteIcon,
  CalendarDaysIcon,
  ClockIcon,
  GraduationCapIcon,
  MapPinIcon,
} from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { RequirementChips } from "@/components/jobs/job-feed-card";
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

function Fact({
  icon: Icon,
  label,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-zinc-500" />
      <span className="text-sm text-zinc-600" title={title}>
        {label}
      </span>
    </div>
  );
}

export function JobDetailModal({
  job,
  isOpen,
  onOpenChange,
}: {
  job: StudentJobListItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deadline = dateFormatter.format(new Date(job.deadline));
  const deadlineStatus = deadlineRemainingLabel(new Date(job.deadline));

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={job.title}
      size="lg"
    >
      <Modal.Body>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
              {job.jobType}
            </span>
            <span className="text-sm text-zinc-500">{job.department}</span>
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600">
            {job.description}
          </p>

          <div className="grid gap-y-3 sm:grid-cols-2">
            <Fact
              icon={ClockIcon}
              label={
                job.hours !== null
                  ? `${job.hours} hrs/week`
                  : "Hours not specified"
              }
            />
            <Fact icon={MapPinIcon} label={job.campus.join(", ")} />
            <Fact
              icon={BanknoteIcon}
              label={
                job.hourlyPay > 0
                  ? `${payFormatter.format(job.hourlyPay)}/hr`
                  : "Unpaid"
              }
            />
            <Fact
              icon={CalendarDaysIcon}
              title={deadline}
              label={deadlineStatus.label}
            />
          </div>

          {job.gpaMin !== null ? (
            <Fact
              icon={GraduationCapIcon}
              label={`GPA Required: ${job.gpaMin.toFixed(2)}`}
            />
          ) : null}

          {job.benefit ? (
            <p className="text-sm text-zinc-600">
              <span className="font-medium text-zinc-900">Benefit or perk:</span>{" "}
              {job.benefit}
            </p>
          ) : null}

          {job.degree.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-900">
                Degree requirements
              </p>
              <RequirementChips items={job.degree} />
            </div>
          ) : null}

          {job.skills.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-900">Skills</p>
              <RequirementChips items={job.skills} />
            </div>
          ) : null}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button.Root
          variant="ghost"
          onPress={() => onOpenChange(false)}
          className="text-zinc-600"
        >
          Close
        </Button.Root>
      </Modal.Footer>
    </FormModal>
  );
}
