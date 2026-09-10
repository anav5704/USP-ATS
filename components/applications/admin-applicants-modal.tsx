"use client";

import { useState } from "react";
import { Button, Modal, Spinner, Table } from "@heroui/react";
import {
  CircleAlertIcon,
  EyeIcon,
  UserCheckIcon,
  UsersRoundIcon,
  XCircleIcon,
} from "lucide-react";
import { ApplicantDetailsModal } from "@/components/applications/applicant-details-modal";
import { ApplicationStatusBadge, APPLICATION_STATUS_LABELS } from "@/components/applications/application-status-badge";
import { ChangeStatusMenu } from "@/components/applications/change-status-menu";
import { useAdminApplicants } from "@/components/applications/use-admin-applicants";
import { useUpdateApplicationStatus } from "@/components/applications/use-update-application-status";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { FormModal } from "@/components/ui/form-modal";
import type {
  AdminApplicantListItem,
  AdminApplicationStatus,
} from "@/lib/applications/application-schema";
import { JOB_DATE_TIME_ZONE } from "@/lib/jobs/job-dates";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";

const dateFormatter = new Intl.DateTimeFormat("en-FJ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: JOB_DATE_TIME_ZONE,
});

type PendingStatusChange = {
  application: AdminApplicantListItem;
  target: AdminApplicationStatus;
};

export function AdminApplicantsModal({
  job,
  isOpen,
  onOpenChange,
}: {
  job: AdminJobListItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isPending, isError, refetch } = useAdminApplicants(job.id);
  const updateStatus = useUpdateApplicationStatus(job.id);
  const [detailApplicationId, setDetailApplicationId] = useState<string | null>(
    null
  );
  const [pendingChange, setPendingChange] =
    useState<PendingStatusChange | null>(null);

  const confirmStatusChange = async () => {
    if (!pendingChange) return;
    try {
      await updateStatus.mutateAsync({
        applicationId: pendingChange.application.id,
        status: pendingChange.target,
      });
      setPendingChange(null);
    } catch {
      setPendingChange(null);
    }
  };

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open && !updateStatus.isPending) onOpenChange(false);
        }}
        title="Applicants"
        size="lg"
        closeDisabled={updateStatus.isPending}
      >
        <Modal.Body>
          <div className="mb-4 rounded-2xl border border-border bg-surface-secondary p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Job posting
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              {data?.job.title ?? job.title}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {job.department} · {job.campus.join(", ")}
            </p>
          </div>

          {isPending ? (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner.Root size="lg" className="text-foreground" />
            </div>
          ) : isError ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <CircleAlertIcon className="size-10 text-danger" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Applicants could not be loaded
              </h3>
              <p className="mt-1 text-sm text-muted">Please try again.</p>
              <Button.Root className="mt-5" onPress={() => void refetch()}>
                Try Again
              </Button.Root>
            </div>
          ) : data?.applications.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
              <UsersRoundIcon className="size-10 text-muted" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                No applicants for this job yet.
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Applicants will appear here after they apply.
              </p>
            </div>
          ) : (
            <Table.Root className="rounded-2xl border border-border bg-surface">
              <Table.ScrollContainer>
                <Table.Content aria-label={`Applicants for ${job.title}`}>
                  <Table.Header>
                    <Table.Column isRowHeader>Applicant</Table.Column>
                    <Table.Column>Campus/Centre</Table.Column>
                    <Table.Column>Applied On</Table.Column>
                    <Table.Column>Status</Table.Column>
                    <Table.Column>Actions</Table.Column>
                  </Table.Header>
                  <Table.Body items={data?.applications ?? []}>
                    {(application) => (
                      <Table.Row id={application.id}>
                        <Table.Cell>
                          <span className="font-medium text-foreground">
                            {application.name}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          {application.campuses.length > 0
                            ? application.campuses.join(", ")
                            : "Not provided"}
                        </Table.Cell>
                        <Table.Cell>
                          {dateFormatter.format(new Date(application.createdAt))}
                        </Table.Cell>
                        <Table.Cell>
                          <ApplicationStatusBadge status={application.status} />
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Button.Root
                              variant="ghost"
                              size="sm"
                              onPress={() =>
                                setDetailApplicationId(application.id)
                              }
                              className="rounded-field px-2.5 text-xs text-foreground"
                            >
                              <EyeIcon className="size-3.5" /> View
                            </Button.Root>
                            <ChangeStatusMenu
                              status={application.status}
                              isDisabled={updateStatus.isPending}
                              onSelect={(target) =>
                                setPendingChange({ application, target })
                              }
                            />
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table.Root>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button.Root
            variant="ghost"
            isDisabled={updateStatus.isPending}
            onPress={() => onOpenChange(false)}
          >
            Close
          </Button.Root>
        </Modal.Footer>
      </FormModal>

      {detailApplicationId ? (
        <ApplicantDetailsModal
          jobId={job.id}
          applicationId={detailApplicationId}
          isOpen
          onOpenChange={(open) => {
            if (!open) setDetailApplicationId(null);
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={pendingChange !== null}
        onOpenChange={(open) => {
          if (!open && !updateStatus.isPending) setPendingChange(null);
        }}
        title={
          pendingChange
            ? `Mark as ${APPLICATION_STATUS_LABELS[
                pendingChange.target
              ].toLowerCase()}?`
            : "Change application status?"
        }
        message={
          pendingChange
            ? `${pendingChange.application.name}'s application for "${job.title}" will be marked ${APPLICATION_STATUS_LABELS[
                pendingChange.target
              ].toLowerCase()}. ${
                pendingChange.target === "SHORTLISTED"
                  ? "It can still be accepted or declined later."
                  : "This final status cannot be reopened."
              }`
            : "Confirm this application status change."
        }
        confirmLabel={
          pendingChange
            ? `Mark ${APPLICATION_STATUS_LABELS[pendingChange.target]}`
            : "Change Status"
        }
        icon={pendingChange?.target === "DECLINED" ? XCircleIcon : UserCheckIcon}
        danger={pendingChange?.target === "DECLINED"}
        isPending={updateStatus.isPending}
        onConfirm={confirmStatusChange}
      />
    </>
  );
}
