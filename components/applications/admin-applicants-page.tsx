"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Modal, Spinner, Table } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CircleAlertIcon,
  UserCheckIcon,
  UsersRoundIcon,
  XCircleIcon,
} from "lucide-react";
import { ApplicantDetailsModal } from "@/components/applications/applicant-details-modal";
import { AdminApplicantsSkeleton } from "@/components/applications/admin-applicants-skeleton";
import { ApplicationScoreCell } from "@/components/applications/application-score-cell";
import {
  APPLICATION_STATUS_LABELS,
} from "@/components/applications/application-status-badge";
import { ChangeStatusMenu } from "@/components/applications/change-status-menu";
import {
  applicantDetailsQueryOptions,
  useAdminApplicants,
  useApplicantDetails,
} from "@/components/applications/use-admin-applicants";
import { useRescoreApplication } from "@/components/applications/use-rescore-application";
import { useUpdateApplicationStatus } from "@/components/applications/use-update-application-status";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { FormModal } from "@/components/ui/form-modal";
import { useInfiniteScroll } from "@/components/ui/use-infinite-scroll";
import type {
  AdminApplicantTableItem,
  AdminApplicationStatus,
} from "@/lib/applications/application-schema";
import { JOB_DATE_TIME_ZONE } from "@/lib/jobs/job-dates";

const dateFormatter = new Intl.DateTimeFormat("en-FJ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: JOB_DATE_TIME_ZONE,
});

type PendingStatusChange = {
  application: AdminApplicantTableItem;
  target: AdminApplicationStatus;
};

export function AdminApplicantsPage({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminApplicants(jobId);
  const updateStatus = useUpdateApplicationStatus(jobId);
  const rescore = useRescoreApplication(jobId);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [pendingChange, setPendingChange] =
    useState<PendingStatusChange | null>(null);
  const {
    data: selectedApplication,
    isPending: isDetailPending,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useApplicantDetails(jobId, selectedApplicationId);

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

  const prefetchApplicant = (applicationId: string) => {
    void queryClient.prefetchQuery(
      applicantDetailsQueryOptions(jobId, applicationId)
    );
  };

  const applications = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data]
  );
  const job = data?.pages[0]?.job;
  const total = data?.pages[0]?.total ?? 0;
  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage: () => void fetchNextPage(),
  });

  const openApplicant = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
  };

  if (isPending) return <AdminApplicantsSkeleton />;

  return (
    <div className="p-3">
      <div className="mx-auto max-w-none">
        <div className="mb-4 rounded-2xl border border-border bg-surface p-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-field text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Return to Job Postings
          </Link>
          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Applicants
            </h1>
            {job ? (
              <>
                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  {job.title}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {job.department} · {job.campus.join(", ")}
                </p>
              </>
            ) : null}
          </div>
        </div>

        {isError || !data ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <CircleAlertIcon className="size-10 text-danger" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              Applicants could not be loaded
            </h2>
            <p className="mt-1 text-sm text-muted">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try Again
            </Button.Root>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
            <UsersRoundIcon className="size-10 text-muted" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              No applicants yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Applicants will appear here after they apply.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-muted">
              Showing {applications.length} of {total} applicants
            </p>
            <Table.Root className="rounded-2xl border border-border bg-surface">
            <Table.ScrollContainer>
              <Table.Content aria-label={`Applicants for ${job?.title ?? "job"}`}>
                <Table.Header>
                  <Table.Column isRowHeader>Applicant</Table.Column>
                  <Table.Column>Campus/Centre</Table.Column>
                  <Table.Column>Applied On</Table.Column>
                  <Table.Column>AI Score</Table.Column>
                  <Table.Column>Status</Table.Column>
                </Table.Header>
                <Table.Body items={applications}>
                  {(application) => (
                    <Table.Row
                      id={application.id}
                      textValue={application.applicant.name}
                      className="cursor-pointer transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
                      onAction={() => openApplicant(application.id)}
                      onHoverStart={() => prefetchApplicant(application.id)}
                    >
                      <Table.Cell>
                        <span className="font-medium text-foreground">
                          {application.applicant.name}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {application.applicant.campuses.length
                          ? application.applicant.campuses.join(", ")
                          : "Not provided"}
                      </Table.Cell>
                      <Table.Cell>
                        {dateFormatter.format(new Date(application.createdAt))}
                      </Table.Cell>
                      <Table.Cell>
                        <div
                          className="inline-flex"
                          onPointerDown={(event) => event.stopPropagation()}
                          onPointerUp={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <ApplicationScoreCell
                            score={application.score}
                            onRescore={() => rescore.mutate(application.id)}
                            isRescoring={
                              rescore.isPending &&
                              rescore.variables === application.id
                            }
                          />
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div
                          className="inline-flex"
                          onPointerDown={(event) => event.stopPropagation()}
                          onPointerUp={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
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
          <div ref={sentinelRef} aria-hidden="true" />
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center py-4">
              <Spinner.Root size="lg" className="text-foreground" />
            </div>
          ) : null}
          </div>
        )}
      </div>

      {selectedApplicationId && job ? (
        selectedApplication ? (
          <ApplicantDetailsModal
            job={job}
            application={selectedApplication}
            isOpen
            onOpenChange={(open) => {
              if (!open) setSelectedApplicationId(null);
            }}
          />
        ) : (
          <FormModal
            isOpen
            onOpenChange={(open) => {
              if (!open) setSelectedApplicationId(null);
            }}
            title="Applicant Details"
          >
            <Modal.Body>
              {isDetailError ? (
                <div className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
                  <CircleAlertIcon className="size-10 text-danger" />
                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    Applicant details could not be loaded
                  </h2>
                  <p className="mt-1 text-sm text-muted">Please try again.</p>
                  <Button.Root
                    className="mt-5"
                    onPress={() => void refetchDetail()}
                  >
                    Try Again
                  </Button.Root>
                </div>
              ) : (
                isDetailPending && (
                  <div className="flex min-h-48 items-center justify-center">
                    <Spinner.Root size="lg" className="text-foreground" />
                  </div>
                )
              )}
            </Modal.Body>
          </FormModal>
        )
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
            ? `${pendingChange.application.applicant.name}'s application for "${
                job?.title ?? "this job"
              }" will be marked ${APPLICATION_STATUS_LABELS[
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
            : "Confirm"
        }
        icon={pendingChange?.target === "DECLINED" ? XCircleIcon : UserCheckIcon}
        danger={pendingChange?.target === "DECLINED"}
        isPending={updateStatus.isPending}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
