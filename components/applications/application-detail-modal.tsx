"use client";

import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import {
  BanknoteIcon,
  CalendarDaysIcon,
  ClockIcon,
  GraduationCapIcon,
  MapPinIcon,
} from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { useWithdraw } from "@/components/applications/use-withdraw";
import { canWithdraw } from "@/lib/applications/application-rules";
import { MetaRow, RequirementChips } from "@/components/jobs/job-feed-card";
import type { ApplicationListItem } from "@/lib/applications/application-schema";
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

export function ApplicationDetailModal({
  application,
  isOpen,
  onOpenChange,
}: {
  application: ApplicationListItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const job = application.job;
  const deadline = deadlineRemainingLabel(new Date(job.deadline));
  const deadlineTitle = dateFormatter.format(new Date(job.deadline));
  const { isPending, withdrawAsync } = useWithdraw();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmWithdraw = async () => {
    try {
      await withdrawAsync(application.id);
      setConfirmOpen(false);
    } catch {
      // error toast is shown by useWithdraw
    }
  };

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
            <span className="inline-block rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
              {job.jobType}
            </span>
            <span className="text-sm text-muted">{job.department}</span>
            <span className="ml-auto">
              <ApplicationStatusBadge status={application.status} />
            </span>
          </div>

          <MetaRow
            items={[
              { icon: MapPinIcon, label: job.campus.join(", ") },
              {
                icon: CalendarDaysIcon,
                label: deadline.label,
                title: deadlineTitle,
              },
              {
                icon: ClockIcon,
                label:
                  job.hours !== null
                    ? `${job.hours} hrs/week`
                    : "Hours not specified",
              },
              {
                icon: BanknoteIcon,
                label:
                  job.hourlyPay > 0
                    ? `${payFormatter.format(job.hourlyPay)}/hr`
                    : "Unpaid",
              },
            ]}
          />

          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
            {job.description}
          </p>

          {job.gpaMin !== null ? (
            <Fact
              icon={GraduationCapIcon}
              label={`GPA Required: ${job.gpaMin.toFixed(2)}`}
            />
          ) : null}

          {job.benefit ? (
            <p className="text-sm text-muted">
              <span className="font-medium text-foreground">
                Benefit or perk:
              </span>{" "}
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

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Your cover letter
            </p>
            <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {application.coverLetter}
              </p>
            </div>
            <p className="text-xs text-muted">
              Submitted {dateFormatter.format(new Date(application.createdAt))}
            </p>
          </div>
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
          {canWithdraw(application.status) ? (
            <Button.Root
              onPress={() => setConfirmOpen(true)}
              className="rounded-field bg-danger px-5 text-sm font-medium text-danger-foreground transition-colors hover:bg-danger-hover"
            >
              Withdraw Application
            </Button.Root>
          ) : null}
        </div>
      </Modal.Footer>
      <ConfirmModal
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmOpen(false);
        }}
        title="Withdraw application?"
        message={`You are withdrawing your application for "${job.title}". It will remain in My Applications with a Withdrawn status, and you will not be able to apply for this job again.`}
        confirmLabel="Withdraw"
        isPending={isPending}
        onConfirm={confirmWithdraw}
      />
    </FormModal>
  );
}