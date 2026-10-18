"use client";

import { Button, Modal } from "@heroui/react";
import {
  BanknoteIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  GraduationCapIcon,
  MapPinIcon,
  SendIcon,
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
      <Icon className="size-4 shrink-0 text-muted" />
      <span className="text-sm text-muted" title={title}>
        {label}
      </span>
    </div>
  );
}

export function JobDetailModal({
  job,
  isOpen,
  onOpenChange,
  hasApplied,
  onApply,
  readOnly = false,
}: {
  job: StudentJobListItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hasApplied?: boolean;
  onApply?: () => void;
  readOnly?: boolean;
}) {
  const deadline = dateFormatter.format(new Date(job.deadline));
  const deadlineStatus = deadlineRemainingLabel(new Date(job.deadline));

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={job.title}
      size="lg"
      info={{
        title: "About requirements",
        body: "Requirements listed here are matched against applicant profiles by AI scoring. Applications are accepted until the deadline passes.",
      }}
    >
      <Modal.Body>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
              {job.jobType}
            </span>
            <span className="text-sm text-muted">{job.department}</span>
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
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
            <p className="text-sm text-muted">
              <span className="font-medium text-foreground">Benefit or perk:</span>{" "}
              {job.benefit}
            </p>
          ) : null}

          {job.degree.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Qualification requirements
              </p>
              <RequirementChips items={job.degree} />
            </div>
          ) : null}

          {job.skills.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Skills</p>
              <RequirementChips items={job.skills} />
            </div>
          ) : null}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-end gap-3">
          <Button.Root
            variant="ghost"
            onPress={() => onOpenChange(false)}
            className="rounded-field text-muted"
          >
            Close
          </Button.Root>
          {readOnly ? null : hasApplied ? (
            <Button.Root
              isDisabled
              className="rounded-field bg-foreground px-5 text-sm font-medium text-background"
            >
              <CheckIcon className="size-4" />
              Applied
            </Button.Root>
          ) : (
            <Button.Root
              onPress={onApply}
              className="rounded-field bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
            >
              <SendIcon className="size-4" />
              Apply Now
            </Button.Root>
          )}
        </div>
      </Modal.Footer>
    </FormModal>
  );
}
