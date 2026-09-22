"use client";

import { useMemo, useState } from "react";
import { Button, SearchField, Spinner, Table } from "@heroui/react";
import {
  CircleAlertIcon,
  ClipboardCheckIcon,
  EyeIcon,
  SearchXIcon,
  XIcon,
} from "lucide-react";
import {
  ApprovalFilterPopover,
  EMPTY_APPROVAL_FILTERS,
  type ApprovalFilters,
} from "@/components/jobs/approvals/approval-filter-popover";
import { ApprovalReviewModal } from "@/components/jobs/approvals/approval-review-modal";
import { ApprovalStatusBadge } from "@/components/jobs/approvals/approval-status-badge";
import { useApprovals } from "@/components/jobs/approvals/use-approvals";
import { getApprovalStatus } from "@/lib/jobs/approval-status";
import { isOwnApprovalRequest } from "@/lib/jobs/approval-schema";
import { JOB_DATE_TIME_ZONE } from "@/lib/jobs/job-dates";
import type { ApprovalJob } from "@/lib/jobs/job-schema";
import { useAuth } from "@/lib/use-auth";

const payFormatter = new Intl.NumberFormat("en-FJ", {
  style: "currency",
  currency: "FJD",
});

const requestDateFormatter = new Intl.DateTimeFormat("en-FJ", {
  timeZone: JOB_DATE_TIME_ZONE,
});

function matchesSearch(job: ApprovalJob, search: string) {
  if (search === "") return true;

  return [
    job.title,
    job.department,
    ...job.campus,
  ].some((value) => value?.toLowerCase().includes(search));
}

function matchesFilters(job: ApprovalJob, filters: ApprovalFilters) {
  const matchesRequestType =
    filters.requestType === "" || job.requestType === filters.requestType;
  const matchesStatus =
    filters.status === "" || getApprovalStatus(job) === filters.status;
  const matchesType =
    filters.jobType === "" || job.jobType === filters.jobType;
  const matchesCampus =
    filters.campus === "" || job.campus.includes(filters.campus);

  return (
    matchesRequestType && matchesStatus && matchesType && matchesCampus
  );
}

export function ApprovalList() {
  const { data: jobs, isPending, isError, refetch } = useApprovals();
  const { data: session } = useAuth();
  const [reviewing, setReviewing] = useState<ApprovalJob | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ApprovalFilters>(
    EMPTY_APPROVAL_FILTERS
  );

  const adminId = session?.user.id ?? "";
  const activeFilterCount =
    (filters.requestType !== "" ? 1 : 0) +
    (filters.status !== "" ? 1 : 0) +
    (filters.jobType !== "" ? 1 : 0) +
    (filters.campus !== "" ? 1 : 0);
  const hasSearch = search.trim() !== "";
  const hasPresentationFilters = hasSearch || activeFilterCount > 0;

  const sections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const allJobs = jobs ?? [];
    const myRequests = allJobs.filter((job) =>
      isOwnApprovalRequest(job, adminId)
    );
    const reviewRequests = allJobs.filter(
      (job) =>
        job.approvalStatus === "Pending Approval" &&
        !isOwnApprovalRequest(job, adminId)
    );
    const applyPresentationFilters = (requests: ApprovalJob[]) =>
      requests.filter(
        (job) =>
          matchesSearch(job, normalizedSearch) && matchesFilters(job, filters)
      );

    return [
      {
        title: "My Approval Requests",
        subtitle: "Requests you have submitted for approval",
        mine: true,
        totalCount: myRequests.length,
        jobs: applyPresentationFilters(myRequests),
      },
      {
        title: "Requests for Review",
        subtitle: "Approval requests awaiting your review",
        mine: false,
        totalCount: reviewRequests.length,
        jobs: applyPresentationFilters(reviewRequests),
      },
    ];
  }, [adminId, filters, jobs, search]);

  const clearFilters = () => {
    setFilters(EMPTY_APPROVAL_FILTERS);
  };

  const activeFilters = [
    filters.requestType
      ? {
          key: "requestType",
          label:
            filters.requestType === "MODIFICATION"
              ? "Modification"
              : "New Posting",
          remove: () =>
            setFilters((current) => ({ ...current, requestType: "" })),
        }
      : null,
    filters.status
      ? {
          key: "status",
          label: filters.status,
          remove: () =>
            setFilters((current) => ({ ...current, status: "" })),
        }
      : null,
    filters.campus
      ? {
          key: "campus",
          label: filters.campus,
          remove: () =>
            setFilters((current) => ({ ...current, campus: "" })),
        }
      : null,
    filters.jobType
      ? {
          key: "jobType",
          label: filters.jobType,
          remove: () =>
            setFilters((current) => ({ ...current, jobType: "" })),
        }
      : null,
  ].filter((filter): filter is NonNullable<typeof filter> => filter !== null);

  return (
    <div className="p-3">
      <div className="sticky top-3 z-10 mb-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchField
              fullWidth
              value={search}
              onChange={setSearch}
              aria-label="Search approval requests by job title, department or campus"
            >
              <SearchField.Group className="border-border">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by job title, department or campus..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <ApprovalFilterPopover
            filters={filters}
            activeFilterCount={activeFilterCount}
            onChange={setFilters}
            onClear={clearFilters}
          />
        </div>

        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {activeFilters.map((filter) => (
              <Button.Root
                key={filter.key}
                type="button"
                variant="ghost"
                aria-label={`Remove ${filter.label} filter`}
                onPress={filter.remove}
                className="h-auto cursor-pointer gap-1.5 rounded-full bg-surface-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-tertiary"
              >
                {filter.label}
                <XIcon className="size-3.5" />
              </Button.Root>
            ))}
            <Button.Root
              type="button"
              variant="ghost"
              onPress={clearFilters}
              className="h-auto cursor-pointer rounded-field px-2 py-1.5 text-xs font-medium text-muted hover:text-foreground"
            >
              Clear all
            </Button.Root>
          </div>
        ) : null}
      </div>

      {isPending ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface">
          <Spinner.Root size="lg" className="text-foreground" />
        </div>
      ) : isError ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
          <CircleAlertIcon className="size-10 text-danger" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Approval requests could not be loaded
          </h2>
          <Button.Root className="mt-5" onPress={() => void refetch()}>
            Try Again
          </Button.Root>
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.title} className="mb-6">
            <div className="mb-3">
              <h2 className="text-xl font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{section.subtitle}</p>
            </div>
            {section.jobs.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
                {section.totalCount > 0 && hasPresentationFilters ? (
                  <SearchXIcon className="size-10 text-muted" />
                ) : (
                  <ClipboardCheckIcon className="size-10 text-muted" />
                )}
                <p className="mt-4 text-xl font-semibold text-foreground">
                  {section.totalCount > 0 && hasPresentationFilters
                    ? "No matching requests"
                    : section.mine
                      ? "You have no approval requests"
                      : "No requests awaiting your review"}
                </p>
                {section.totalCount > 0 && hasPresentationFilters ? (
                  <p className="mt-1 text-sm text-muted">
                    Try changing your search or filters.
                  </p>
                ) : null}
                {section.totalCount > 0 && activeFilterCount > 0 ? (
                  <Button.Root
                    className="mt-5 rounded-field border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary"
                    onPress={clearFilters}
                  >
                    Clear Filters
                  </Button.Root>
                ) : null}
              </div>
            ) : (
              <Table.Root className="rounded-2xl border border-border bg-surface">
                <Table.ScrollContainer>
                  <Table.Content aria-label={section.title}>
                    <Table.Header>
                      <Table.Column isRowHeader>Job Title</Table.Column>
                      <Table.Column>Job Type</Table.Column>
                      <Table.Column>Campus/Centre</Table.Column>
                      <Table.Column>Hourly Pay</Table.Column>
                      <Table.Column>Requested By</Table.Column>
                      <Table.Column>Date Requested</Table.Column>
                      <Table.Column>Actions</Table.Column>
                      <Table.Column>Status / Review</Table.Column>
                    </Table.Header>
                    <Table.Body items={section.jobs}>
                      {(job) => (
                        <Table.Row id={job.approvalId}>
                          <Table.Cell>
                            <p className="font-medium text-foreground">
                              {job.title}
                            </p>
                            <p className="text-xs text-muted">
                              {job.department}
                            </p>
                            <p className="mt-1 text-xs font-medium text-muted">
                              {job.requestType === "MODIFICATION"
                                ? "Modification"
                                : "New posting"}
                            </p>
                          </Table.Cell>
                          <Table.Cell>{job.jobType}</Table.Cell>
                          <Table.Cell>{job.campus.join(", ")}</Table.Cell>
                          <Table.Cell>
                            {payFormatter.format(job.hourlyPay)}
                          </Table.Cell>
                          <Table.Cell>
                            {(job.requestedBy ?? job.createdBy).name}
                          </Table.Cell>
                          <Table.Cell>
                            {requestDateFormatter.format(
                              new Date(job.requestedAt)
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <Button.Root
                              variant="ghost"
                              onPress={() => {
                                setReviewing(job);
                              }}
                              aria-label={`${section.mine ? "View" : "Review"} ${
                                job.title
                              }`}
                            >
                              <EyeIcon className="size-4" />
                              {section.mine ? "View" : "Review"}
                            </Button.Root>
                          </Table.Cell>
                          <Table.Cell>
                            <ApprovalStatusBadge job={job} />
                            <p className="mt-1 text-xs text-muted">
                              {(job.approvedBy ?? job.rejectedBy)?.name}
                            </p>
                            {job.rejectionReason ? (
                              <p className="mt-1 whitespace-pre-wrap text-xs text-muted">
                                {job.rejectionReason}
                              </p>
                            ) : null}
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table.Root>
            )}
          </section>
        ))
      )}

      {reviewing ? (
        <ApprovalReviewModal
          key={`${reviewing.approvalId}:${reviewing.revision}`}
          job={reviewing}
          onClose={() => setReviewing(null)}
        />
      ) : null}

    </div>
  );
}
