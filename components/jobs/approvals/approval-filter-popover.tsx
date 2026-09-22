"use client";

import { Button, Popover } from "@heroui/react";
import { SlidersHorizontalIcon, Trash2Icon } from "lucide-react";
import {
  ApprovalFilterSelect,
  type ApprovalFilterOption,
} from "@/components/jobs/approvals/approval-filter-select";
import { JOB_TYPES, USP_CAMPUSES_CENTRES } from "@/lib/jobs/job-constants";

const REQUEST_TYPE_OPTIONS: readonly ApprovalFilterOption[] = [
  { value: "NEW_JOB", label: "New Posting" },
  { value: "MODIFICATION", label: "Modification" },
];

const APPROVAL_STATUS_OPTIONS: readonly ApprovalFilterOption[] = [
  { value: "Pending Approval", label: "Pending Approval" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const CAMPUS_OPTIONS = USP_CAMPUSES_CENTRES.map((campus) => ({
  value: campus,
  label: campus,
}));

const JOB_TYPE_OPTIONS = JOB_TYPES.map((jobType) => ({
  value: jobType,
  label: jobType,
}));

export type ApprovalFilters = {
  requestType: string;
  status: string;
  campus: string;
  jobType: string;
};

export const EMPTY_APPROVAL_FILTERS: ApprovalFilters = {
  requestType: "",
  status: "",
  campus: "",
  jobType: "",
};

export function ApprovalFilterPopover({
  filters,
  activeFilterCount,
  onChange,
  onClear,
}: {
  filters: ApprovalFilters;
  activeFilterCount: number;
  onChange: (filters: ApprovalFilters) => void;
  onClear: () => void;
}) {
  const setFilter = <Key extends keyof ApprovalFilters>(
    key: Key,
    value: ApprovalFilters[Key]
  ) => onChange({ ...filters, [key]: value });

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Filter approval requests"
        className="flex shrink-0 cursor-pointer items-center gap-2 rounded-field border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground outline-none transition-colors hover:bg-surface-tertiary focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
      >
        <SlidersHorizontalIcon className="size-4" />
        Filters
        {activeFilterCount > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
            {activeFilterCount}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Content
        placement="bottom end"
        className="max-h-[min(34rem,calc(100vh-2rem))] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto"
      >
        <Popover.Dialog className="space-y-4 p-4 outline-none">
          <Popover.Heading className="text-base font-semibold text-foreground">
            Filter approval requests
          </Popover.Heading>

          <ApprovalFilterSelect
            label="Request type"
            value={filters.requestType}
            allLabel="All"
            options={REQUEST_TYPE_OPTIONS}
            onChange={(value) => setFilter("requestType", value)}
          />
          <ApprovalFilterSelect
            label="Approval status"
            value={filters.status}
            allLabel="All"
            options={APPROVAL_STATUS_OPTIONS}
            onChange={(value) => setFilter("status", value)}
          />
          <ApprovalFilterSelect
            label="Campus/Centre"
            value={filters.campus}
            allLabel="All Campuses/Centres"
            options={CAMPUS_OPTIONS}
            onChange={(value) => setFilter("campus", value)}
          />
          <ApprovalFilterSelect
            label="Job type"
            value={filters.jobType}
            allLabel="All Job Types"
            options={JOB_TYPE_OPTIONS}
            onChange={(value) => setFilter("jobType", value)}
          />

          {activeFilterCount > 0 ? (
            <div className="flex justify-end border-t border-border pt-3">
              <Button.Root
                type="button"
                variant="ghost"
                onPress={onClear}
                className="rounded-field text-muted"
              >
                <Trash2Icon className="size-4" />
                Clear filters
              </Button.Root>
            </div>
          ) : null}
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
