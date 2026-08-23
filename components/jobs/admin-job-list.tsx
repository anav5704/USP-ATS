"use client";

import { useMemo, useState } from "react";
import { Button, Dropdown, SearchField, Spinner, Table } from "@heroui/react";
import {
  ArchiveIcon,
  BriefcaseBusinessIcon,
  CircleAlertIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { useAdminJobs } from "@/components/jobs/use-admin-jobs";
import { useRemoveJob } from "@/components/jobs/use-remove-job";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CreateJobModal } from "@/components/jobs/create-job-modal";
import { EditJobModal } from "@/components/jobs/edit-job-modal";
import {
  AdminJobFilterModal,
  EMPTY_ADMIN_FILTERS,
  type AdminJobFilters,
} from "@/components/jobs/admin-job-filter-modal";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";
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

function jobIsExpired(job: AdminJobListItem) {
  return job.status === "ACTIVE" && new Date(job.deadline).getTime() < Date.now();
}

export function AdminJobList() {
  const { data: jobs, isPending, isError, refetch } = useAdminJobs();
  const { isPending: isRemoving, removeAsync } = useRemoveJob();
  const [selectedJob, setSelectedJob] = useState<AdminJobListItem | null>(null);
  const [editingJob, setEditingJob] = useState<AdminJobListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminJobFilters>(EMPTY_ADMIN_FILTERS);
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

  const visibleJobs = useMemo(() => {
    if (!jobs) return jobs;
    const normalizedSearch = search.trim().toLowerCase();
    const gpaValue = Number(filters.gpaMin);

    return jobs.filter((job) => {
      const expired = jobIsExpired(job);
      const matchesSearch =
        normalizedSearch === "" ||
        job.title.toLowerCase().includes(normalizedSearch) ||
        job.description.toLowerCase().includes(normalizedSearch) ||
        job.department.toLowerCase().includes(normalizedSearch);
      const matchesType = filters.jobType === "" || job.jobType === filters.jobType;
      const matchesCampus =
        filters.campuses.length === 0 ||
        job.campus.some((campus) => filters.campuses.includes(campus));
      const matchesGpa =
        filters.gpaMin === "" ||
        Number.isNaN(gpaValue) ||
        job.gpaMin === null ||
        job.gpaMin <= gpaValue;
      const matchesDegree =
        filters.degrees.length === 0 ||
        job.degree.length === 0 ||
        job.degree.some((degree) => filters.degrees.includes(degree));
      const matchesSkills =
        filters.skills.length === 0 ||
        job.skills.length === 0 ||
        job.skills.some((skill) => filters.skills.includes(skill));
      const matchesStatus =
        filters.status === "" ||
        (filters.status === "Active"
          ? job.status === "ACTIVE" && !expired
          : filters.status === "Archived"
            ? job.status === "ARCHIVED"
            : expired);

      return (
        matchesSearch &&
        matchesType &&
        matchesCampus &&
        matchesGpa &&
        matchesDegree &&
        matchesSkills &&
        matchesStatus
      );
    });
  }, [jobs, search, filters]);

  const clearFilters = () => {
    setSearch("");
    setFilters(EMPTY_ADMIN_FILTERS);
  };

  const confirmRemoval = () => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    setSelectedJob(null);
    void removeAsync(jobId);
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-none">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchField
              fullWidth
              value={search}
              onChange={setSearch}
              aria-label="Search job postings"
            >
              <SearchField.Group className="border-zinc-200">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by title, description or department" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <Button.Root
            onPress={() => setFiltersOpen(true)}
            className="shrink-0 rounded-field border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <SlidersHorizontalIcon className="size-4" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </Button.Root>
          <Button.Root
            onPress={() => setCreateOpen(true)}
            className="shrink-0 rounded-field bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <PlusIcon className="size-4" />
            Create New Job
          </Button.Root>
        </div>

        {isPending ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <Spinner.Root size="lg" className="text-zinc-900" />
          </div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <CircleAlertIcon className="size-10 text-rose-500" />
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              Job postings could not be loaded
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try Again
            </Button.Root>
          </div>
        ) : jobs?.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <BriefcaseBusinessIcon className="size-10 text-zinc-400" />
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              No job postings yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Create the first posting to make it immediately available to students.
            </p>
          </div>
        ) : visibleJobs && visibleJobs.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <SearchXIcon className="size-10 text-zinc-400" />
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              No jobs match your filters
            </h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Try adjusting your search or clearing the filters.
            </p>
            <Button.Root
              className="mt-5 rounded-field border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              onPress={clearFilters}
            >
              Clear Filters
            </Button.Root>
          </div>
        ) : (
          <div>
            {jobs && jobs.length > 0 && hasFilters ? (
              <p className="mb-3 text-sm text-zinc-500">
                Showing {visibleJobs?.length} of {jobs.length} jobs
              </p>
            ) : null}
            <Table.Root className="rounded-2xl border border-zinc-200 bg-white">
            <Table.ScrollContainer>
              <Table.Content aria-label="Job postings">
                <Table.Header>
                  <Table.Column isRowHeader>Job</Table.Column>
                  <Table.Column>Type</Table.Column>
                  <Table.Column>Campus/Centre</Table.Column>
                  <Table.Column>Hourly pay</Table.Column>
                  <Table.Column>Deadline</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Applications</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                  <Table.Body items={visibleJobs}>
                  {(job) => (
                    <Table.Row id={job.id}>
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-zinc-900">{job.title}</p>
                          <p className="text-xs text-zinc-500">{job.department}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{job.jobType}</Table.Cell>
                      <Table.Cell>{job.campus.join(", ")}</Table.Cell>
                      <Table.Cell>{payFormatter.format(job.hourlyPay)}</Table.Cell>
                      <Table.Cell>
                        <span
                          title={dateFormatter.format(new Date(job.deadline))}
                        >
                          {deadlineRemainingLabel(new Date(job.deadline)).label}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {(() => {
                          const isExpired =
                            job.status === "ACTIVE" &&
                            deadlineRemainingLabel(
                              new Date(job.deadline),
                            ).expired;
                          const label = isExpired
                            ? "Expired"
                            : job.status === "ACTIVE"
                              ? "Active"
                              : "Archived";
                          const badgeClass = isExpired
                            ? "bg-amber-50 text-amber-700"
                            : job.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600";
                          return (
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}
                            >
                              {label}
                            </span>
                          );
                        })()}
                      </Table.Cell>
                      <Table.Cell>{job.applicationCount}</Table.Cell>
                      <Table.Cell>
                        <Dropdown.Root>
                          <Dropdown.Trigger
                            aria-label={`Actions for ${job.title}`}
                            className="rounded-xl p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100"
                          >
                            <MoreVerticalIcon className="size-4" />
                          </Dropdown.Trigger>
                          <Dropdown.Popover placement="right">
                            <Dropdown.Menu>
                              <Dropdown.Item
                                textValue="Edit"
                                onAction={() => setEditingJob(job)}
                                className="flex items-center gap-2"
                              >
                                <PencilIcon className="size-4" />
                                Edit
                              </Dropdown.Item>
                              {job.status === "ACTIVE" ? (
                                <Dropdown.Item
                                  textValue={
                                    job.applicationCount === 0
                                      ? "Delete"
                                      : "Archive"
                                  }
                                  onAction={() => setSelectedJob(job)}
                                  className="flex items-center gap-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  {job.applicationCount === 0 ? (
                                    <Trash2Icon className="size-4" />
                                  ) : (
                                    <ArchiveIcon className="size-4" />
                                  )}
                                  {job.applicationCount === 0
                                    ? "Delete"
                                    : "Archive"}
                                </Dropdown.Item>
                              ) : null}
                            </Dropdown.Menu>
                          </Dropdown.Popover>
                        </Dropdown.Root>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
            </Table.Root>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={selectedJob !== null}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setSelectedJob(null);
        }}
        title={
          selectedJob?.applicationCount === 0
            ? "Delete job posting?"
            : "Archive job posting?"
        }
        message={
          selectedJob?.applicationCount === 0
            ? "This posting currently has no applications and will be permanently deleted. The server will verify this again before deleting."
            : "This posting has applications and will be archived. All applications and AI scores will be preserved."
        }
        confirmLabel={
          selectedJob?.applicationCount === 0
            ? "Delete posting"
            : "Archive posting"
        }
        icon={selectedJob?.applicationCount === 0 ? Trash2Icon : ArchiveIcon}
        danger={selectedJob?.applicationCount === 0}
        isPending={isRemoving}
        onConfirm={confirmRemoval}
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
      {filtersOpen ? (
        <AdminJobFilterModal
          filters={filters}
          onApply={setFilters}
          onOpenChange={setFiltersOpen}
        />
      ) : null}
    </div>
  );
}
