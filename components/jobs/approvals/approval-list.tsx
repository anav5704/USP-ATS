"use client";

import { useMemo, useState } from "react";
import { Button, SearchField, Spinner, Table, Tabs } from "@heroui/react";
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
import { useDebouncedValue } from "@/components/jobs/use-debounced-value";
import { TablePagination } from "@/components/ui/table-pagination";
import type { ApprovalTab } from "@/lib/jobs/approval-filters";
import { JOB_DATE_TIME_ZONE } from "@/lib/jobs/job-dates";
import type { ApprovalJob } from "@/lib/jobs/job-schema";

const payFormatter = new Intl.NumberFormat("en-FJ", {
  style: "currency",
  currency: "FJD",
});

const requestDateFormatter = new Intl.DateTimeFormat("en-FJ", {
  timeZone: JOB_DATE_TIME_ZONE,
});

function ApprovalTable({
  title,
  mine,
  jobs,
  total,
  hasPresentationFilters,
  activeFilterCount,
  clearFilters,
  onReview,
  page,
  pageSize,
  onPageChange,
}: {
  title: string;
  mine: boolean;
  jobs: ApprovalJob[];
  total: number;
  hasPresentationFilters: boolean;
  activeFilterCount: number;
  clearFilters: () => void;
  onReview: (job: ApprovalJob) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="flex min-h-72 flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
        {total > 0 && hasPresentationFilters ? (
          <SearchXIcon className="size-10 text-muted" />
        ) : (
          <ClipboardCheckIcon className="size-10 text-muted" />
        )}
        <p className="mt-4 text-xl font-semibold text-foreground">
          {total > 0 && hasPresentationFilters
            ? "No matching requests"
            : mine
              ? "You have no approval requests"
              : "No requests awaiting your review"}
        </p>
        {total > 0 && hasPresentationFilters ? (
          <p className="mt-1 text-sm text-muted">
            Try changing your search or filters.
          </p>
        ) : null}
        {total > 0 && activeFilterCount > 0 ? (
          <Button.Root
            className="mt-5 rounded-field border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary"
            onPress={clearFilters}
          >
            Clear Filters
          </Button.Root>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Table.Root className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-surface">
        <Table.ScrollContainer className="min-h-0 flex-1 overflow-y-auto">
          <Table.Content aria-label={title}>
            <Table.Header className="sticky top-0 z-10">
              <Table.Column isRowHeader>Job Title</Table.Column>
              <Table.Column>Job Type</Table.Column>
              <Table.Column>Campus/Centre</Table.Column>
              <Table.Column>Hourly Pay</Table.Column>
              <Table.Column>Requested By</Table.Column>
              <Table.Column>Date Requested</Table.Column>
              <Table.Column>Actions</Table.Column>
              <Table.Column>Status / Review</Table.Column>
            </Table.Header>
            <Table.Body items={jobs}>
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
                        onReview(job);
                      }}
                      aria-label={`${mine ? "View" : "Review"} ${
                        job.title
                      }`}
                    >
                      <EyeIcon className="size-4" />
                      {mine ? "View" : "Review"}
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
            <Table.Footer className="shrink-0">
              <TablePagination
                page={page}
                total={total}
                pageSize={pageSize}
                onChange={onPageChange}
              />
            </Table.Footer>
          </Table.Root>
        </div>
      );
    }

export function ApprovalList() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ApprovalFilters>(
    EMPTY_APPROVAL_FILTERS
  );
  const [tab, setTab] = useState<ApprovalTab>("mine");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const serverFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch.trim() }),
    [debouncedSearch, filters]
  );
  const { data, isPending, isError, refetch } = useApprovals(
    serverFilters,
    tab,
    page
  );
  const [reviewing, setReviewing] = useState<ApprovalJob | null>(null);

  const jobs = data?.items ?? [];
  const totals = data?.totals ?? { mine: 0, review: 0 };
  const total = totals[tab];
  const activeFilterCount =
    (filters.requestType !== "" ? 1 : 0) +
    (filters.status !== "" ? 1 : 0) +
    (filters.jobType !== "" ? 1 : 0) +
    (filters.campus !== "" ? 1 : 0);
  const hasSearch = search.trim() !== "";
  const hasPresentationFilters = hasSearch || activeFilterCount > 0;

  const clearFilters = () => {
    setFilters(EMPTY_APPROVAL_FILTERS);
    setPage(1);
  };

  const handleFiltersChange = (next: ApprovalFilters) => {
    setFilters(next);
    setPage(1);
  };

  const removeFilter = (key: keyof ApprovalFilters) => {
    setFilters((current) => ({ ...current, [key]: "" }));
    setPage(1);
  };

  const activeFilters = [
    filters.requestType
      ? {
          key: "requestType",
          label:
            filters.requestType === "MODIFICATION"
              ? "Modification"
              : "New Posting",
          remove: () => removeFilter("requestType"),
        }
      : null,
    filters.status
      ? {
          key: "status",
          label: filters.status,
          remove: () => removeFilter("status"),
        }
      : null,
    filters.campus
      ? {
          key: "campus",
          label: filters.campus,
          remove: () => removeFilter("campus"),
        }
      : null,
    filters.jobType
      ? {
          key: "jobType",
          label: filters.jobType,
          remove: () => removeFilter("jobType"),
        }
      : null,
  ].filter((filter): filter is NonNullable<typeof filter> => filter !== null);

  return (
    <div className="flex h-full flex-col p-3">
      {isPending ? (
        <div className="flex min-h-72 flex-1 items-center justify-center rounded-2xl border border-border bg-surface">
          <Spinner.Root size="lg" className="text-foreground" />
        </div>
      ) : isError ? (
        <div className="flex min-h-72 flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
          <CircleAlertIcon className="size-10 text-danger" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Approval requests could not be loaded
          </h2>
          <Button.Root className="mt-5" onPress={() => void refetch()}>
            Try Again
          </Button.Root>
        </div>
      ) : (
        <Tabs.Root
          selectedKey={tab}
          onSelectionChange={(key) => {
            setTab(String(key) as ApprovalTab);
            setPage(1);
          }}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <div className="shrink-0 space-y-3 rounded-2xl border border-border bg-surface p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <SearchField
                  fullWidth
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
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
                onChange={handleFiltersChange}
                onClear={clearFilters}
              />
            </div>

            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
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

            <Tabs.List aria-label="Approval request groups">
              <Tabs.Tab
                id="mine"
                className="whitespace-nowrap rounded-field px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground data-[selected=true]:bg-foreground data-[selected=true]:text-background"
              >
                My Requests ({totals.mine})
              </Tabs.Tab>
              <Tabs.Tab
                id="review"
                className="whitespace-nowrap rounded-field px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground data-[selected=true]:bg-foreground data-[selected=true]:text-background"
              >
                For Review ({totals.review})
              </Tabs.Tab>
            </Tabs.List>
          </div>
          <Tabs.Panel id="mine" className="mt-0 flex min-h-0 flex-1 flex-col p-0">
            {tab === "mine" ? (
              <ApprovalTable
                title="My Approval Requests"
                mine
                jobs={jobs}
                total={total}
                hasPresentationFilters={hasPresentationFilters}
                activeFilterCount={activeFilterCount}
                clearFilters={clearFilters}
                onReview={setReviewing}
                page={data?.page ?? 1}
                pageSize={data?.pageSize ?? 15}
                onPageChange={setPage}
              />
            ) : null}
          </Tabs.Panel>
          <Tabs.Panel id="review" className="mt-0 flex min-h-0 flex-1 flex-col p-0">
            {tab === "review" ? (
              <ApprovalTable
                title="Requests for Review"
                mine={false}
                jobs={jobs}
                total={total}
                hasPresentationFilters={hasPresentationFilters}
                activeFilterCount={activeFilterCount}
                clearFilters={clearFilters}
                onReview={setReviewing}
                page={data?.page ?? 1}
                pageSize={data?.pageSize ?? 15}
                onPageChange={setPage}
              />
            ) : null}
          </Tabs.Panel>
        </Tabs.Root>
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
