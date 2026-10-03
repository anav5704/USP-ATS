"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, SearchField, Spinner, Table } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon,
  BriefcaseBusinessIcon,
  CircleAlertIcon,
  PencilIcon,
  PlusIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useAdminJobs } from "@/components/jobs/use-admin-jobs";
import { useDebouncedValue } from "@/components/jobs/use-debounced-value";
import { useInfiniteScroll } from "@/components/ui/use-infinite-scroll";
import { useArchiveJob } from "@/components/jobs/use-archive-job";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CreateJobModal } from "@/components/jobs/create-job-modal";
import { EditJobModal } from "@/components/jobs/edit-job-modal";
import { JobDetailModal } from "@/components/jobs/job-detail-modal";
import {
  AdminJobFilterModal,
  EMPTY_ADMIN_FILTERS,
  type AdminJobFilters,
} from "@/components/jobs/admin-job-filter-modal";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";
import { gpaFilterSchema } from "@/lib/jobs/gpa-filter-schema";
import { JobStatusMenu } from "@/components/jobs/job-status-menu";
import { adminApplicantsQueryOptions } from "@/components/applications/use-admin-applicants";
import {
  JOB_DATE_TIME_ZONE,
  deadlineRemainingLabel,
  todayInFiji,
  toFijiDate,
} from "@/lib/jobs/job-dates";

const dateFormatter = new Intl.DateTimeFormat("en-FJ", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: JOB_DATE_TIME_ZONE,
});

const wholePayFormatter = new Intl.NumberFormat("en-FJ", {
  style: "currency",
  currency: "FJD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const decimalPayFormatter = new Intl.NumberFormat("en-FJ", {
  style: "currency",
  currency: "FJD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function hourlyPayLabel(hourlyPay: number) {
  const formatter = Number.isInteger(hourlyPay)
    ? wholePayFormatter
    : decimalPayFormatter;
  return `${formatter.format(hourlyPay)}/hr`;
}

function adminDeadlineLabel(deadline: string) {
  const deadlineDate = new Date(deadline);
  const status = deadlineRemainingLabel(deadlineDate);
  if (!status.expired) return status.label;

  const deadlineYear = toFijiDate(deadlineDate).slice(0, 4);
  const currentYear = todayInFiji().slice(0, 4);
  const dateParts = Object.fromEntries(
    dateFormatter
      .formatToParts(deadlineDate)
      .map((part) => [part.type, part.value])
  );
  const formattedDate = `${dateParts.month} ${dateParts.day}${
    deadlineYear === currentYear ? "" : `, ${dateParts.year}`
  }`;

  return `Closed ${formattedDate}`;
}

export function AdminJobList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminJobFilters>(EMPTY_ADMIN_FILTERS);
  const debouncedSearch = useDebouncedValue(search, 300);
  const serverFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch.trim() }),
    [filters, debouncedSearch]
  );
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminJobs(serverFilters);
  const jobs = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data]
  );
  const total = data?.pages[0]?.total ?? 0;
  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage: () => void fetchNextPage(),
  });
  const { isPending: isArchiving, archiveAsync } = useArchiveJob();
  const [selectedJob, setSelectedJob] = useState<AdminJobListItem | null>(null);
  const [viewingJob, setViewingJob] = useState<AdminJobListItem | null>(null);
  const [editingJob, setEditingJob] = useState<AdminJobListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasFilters =
    search.trim() !== "" ||
    filters.jobType !== "" ||
    filters.campuses.length > 0 ||
    filters.gpaMin !== "" ||
    filters.degrees.length > 0 ||
    filters.skills.length > 0 ||
    filters.status !== "";

  const activeFilterCount =
    (filters.jobType !== "" ? 1 : 0) +
    (filters.campuses.length > 0 ? 1 : 0) +
    (filters.gpaMin !== "" ? 1 : 0) +
    (filters.degrees.length > 0 ? 1 : 0) +
    (filters.skills.length > 0 ? 1 : 0) +
    (filters.status !== "" ? 1 : 0);

  const visibleJobs = jobs;

  const clearFilters = () => {
    setSearch("");
    setFilters(EMPTY_ADMIN_FILTERS);
  };

  const confirmArchive = () => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    setSelectedJob(null);
    void archiveAsync(jobId);
  };

  const prefetchApplicants = (jobId: string) => {
    void queryClient.prefetchInfiniteQuery(adminApplicantsQueryOptions(jobId));
  };

  return (
    <div className="p-3">
      <div className="mx-auto max-w-none">
        <div className="sticky top-3 z-10 mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchField
              fullWidth
              value={search}
              onChange={setSearch}
              aria-label="Search job postings"
            >
              <SearchField.Group className="border-border">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by title, department or campus..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <Button.Root
            onPress={() => setFiltersOpen(true)}
            className="shrink-0 rounded-field border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary"
          >
            <SlidersHorizontalIcon className="size-4" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                {activeFilterCount}
              </span>
            ) : null}
          </Button.Root>
          <Button.Root
            onPress={() => setCreateOpen(true)}
            className="shrink-0 rounded-field bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
          >
            <PlusIcon className="size-4" />
            Create New Job
          </Button.Root>
        </div>

        {isPending ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface">
            <Spinner.Root size="lg" className="text-foreground" />
          </div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <CircleAlertIcon className="size-10 text-danger" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              Job postings could not be loaded
            </h2>
            <p className="mt-1 text-sm text-muted">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try Again
            </Button.Root>
          </div>
        ) : jobs?.length === 0 && !hasFilters ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <BriefcaseBusinessIcon className="size-10 text-muted" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              No job postings yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Create the first posting to make it immediately available to students.
            </p>
          </div>
        ) : jobs?.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <SearchXIcon className="size-10 text-muted" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              No jobs match your filters
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Try adjusting your search or clearing the filters.
            </p>
            <Button.Root
              className="mt-5 rounded-field border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary"
              onPress={clearFilters}
            >
              Clear Filters
            </Button.Root>
          </div>
        ) : (
          <div>
            {jobs.length > 0 ? (
              <p className="mb-3 text-sm text-muted">
                Showing {jobs.length} of {total} jobs
              </p>
            ) : null}
            <Table.Root className="rounded-2xl border border-border bg-surface">
            <Table.ScrollContainer>
              <Table.Content aria-label="Job postings">
                <Table.Header>
                  <Table.Column isRowHeader>Job Posting</Table.Column>
                  <Table.Column>Campus/Centre</Table.Column>
                  <Table.Column>Pay</Table.Column>
                  <Table.Column>Deadline</Table.Column>
                  <Table.Column>Applicants</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Manage</Table.Column>
                </Table.Header>
                  <Table.Body items={visibleJobs}>
                  {(job) => (
                    <Table.Row id={job.id}>
                      <Table.Cell>
                        <div className="min-w-52">
                          <Button.Root
                            variant="ghost"
                            onPress={() => setViewingJob(job)}
                            aria-label={`View job posting details for ${job.title}`}
                            className="h-auto min-w-0 justify-start p-0 text-left font-semibold text-foreground hover:underline focus-visible:underline"
                          >
                            {job.title}
                          </Button.Root>
                          <p className="mt-0.5 text-xs text-muted">
                            {job.department} · {job.jobType}
                          </p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span
                          className="block min-w-40 max-w-64 whitespace-normal break-words"
                          title={job.campus.join(", ")}
                        >
                          {job.campus.join(", ")}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap font-medium text-foreground">
                          {hourlyPayLabel(job.hourlyPay)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span
                          className="whitespace-nowrap"
                          title={dateFormatter.format(new Date(job.deadline))}
                        >
                          {adminDeadlineLabel(job.deadline)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Link
                          href={`/admin/jobs/${encodeURIComponent(job.id)}/applicants`}
                          onMouseEnter={() => prefetchApplicants(job.id)}
                          onFocus={() => prefetchApplicants(job.id)}
                          aria-label={`View ${job.applicationCount} applicants for ${job.title}`}
                          className="inline-flex h-auto min-w-0 cursor-pointer items-center gap-1.5 rounded-field px-2 py-1 font-medium text-foreground hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                        >
                          <UsersRoundIcon className="size-4 text-muted" />
                          {job.applicationCount}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        <JobStatusMenu
                          job={job}
                          onArchive={() => setSelectedJob(job)}
                        />
                        {job.status === "REJECTED" && job.rejectionReason ? (
                          <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{job.rejectionReason}</p>
                        ) : null}
                      </Table.Cell>
                      <Table.Cell>
                        <Button.Root
                          variant="ghost"
                          onPress={() => setEditingJob(job)}
                          className="h-auto gap-2 rounded-field px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
                        >
                          <PencilIcon className="size-4" />
                          Modify
                        </Button.Root>
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
      <ConfirmModal
        isOpen={selectedJob !== null}
        onOpenChange={(open) => {
          if (!open && !isArchiving) setSelectedJob(null);
        }}
        title="Archive job posting?"
        message="This posting will be archived and will no longer accept applications. The posting, applications, applicant details, scores, and approval history will be preserved."
        confirmLabel="Archive posting"
        icon={ArchiveIcon}
        isPending={isArchiving}
        onConfirm={confirmArchive}
      />
      {createOpen ? (
        <CreateJobModal isOpen onOpenChange={setCreateOpen} />
      ) : null}
      {editingJob ? (
        <EditJobModal
          job={editingJob}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditingJob(null);
          }}
        />
      ) : null}
      {viewingJob ? (
        <JobDetailModal
          job={viewingJob}
          isOpen
          readOnly
          onOpenChange={(open) => {
            if (!open) setViewingJob(null);
          }}
        />
      ) : null}
      {filtersOpen ? (
        <AdminJobFilterModal
          filters={filters}
          onApply={(nextFilters) => {
            const gpa = gpaFilterSchema.safeParse(nextFilters.gpaMin);
            if (gpa.success) setFilters({ ...nextFilters, gpaMin: gpa.data });
          }}
          onOpenChange={setFiltersOpen}
        />
      ) : null}
    </div>
  );
}
