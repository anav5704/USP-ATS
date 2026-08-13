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
import {
  MetaRow,
  RequirementChips,
} from "@/components/jobs/job-feed-card";
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

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={job.title}
      size="lg"
    >
      <Modal.Body>
        <div className="space-y-5">
          <div>
            <span className="inline-block rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
              {job.jobType}
            </span>
            <p className="mt-2 text-sm text-zinc-500">{job.department}</p>
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">
            {job.description}
          </p>

          <MetaRow
            items={[
              job.hours !== null
                ? { icon: ClockIcon, label: `${job.hours} hrs/week` }
                : { icon: ClockIcon, label: "Hours not specified" },
              { icon: MapPinIcon, label: job.campus.join(", ") },
              job.hourlyPay > 0
                ? {
                    icon: BanknoteIcon,
                    label: `${payFormatter.format(job.hourlyPay)}/hr`,
                  }
                : { icon: BanknoteIcon, label: "Unpaid" },
              { icon: CalendarDaysIcon, label: `Deadline ${deadline}` },
            ]}
          />

          {job.gpaMin !== null ? (
            <p className="flex items-center gap-1.5 text-sm text-zinc-600">
              <GraduationCapIcon className="size-4 text-zinc-400" />
              Minimum GPA: {job.gpaMin.toFixed(2)}
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
