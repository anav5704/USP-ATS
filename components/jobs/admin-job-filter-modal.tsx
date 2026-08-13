"use client";

import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Trash2Icon } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField } from "@/components/ui/form-field";
import { JobSingleAutocomplete } from "@/components/jobs/job-single-autocomplete";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import { JOB_TYPES, USP_CAMPUSES } from "@/lib/jobs/job-constants";

export const ADMIN_STATUS_OPTIONS = ["Active", "Archived", "Expired"] as const;

export type AdminJobFilters = {
  jobType: string;
  campuses: string[];
  status: string;
};

export const EMPTY_ADMIN_FILTERS: AdminJobFilters = {
  jobType: "",
  campuses: [],
  status: "",
};

export function AdminJobFilterModal({
  filters,
  onApply,
  onOpenChange,
}: {
  filters: AdminJobFilters;
  onApply: (filters: AdminJobFilters) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [jobType, setJobType] = useState(filters.jobType);
  const [campuses, setCampuses] = useState(filters.campuses);
  const [status, setStatus] = useState(filters.status);

  const applyFilters = () => {
    onApply({ jobType, campuses, status });
    onOpenChange(false);
  };

  const clearAll = () => {
    setJobType("");
    setCampuses([]);
    setStatus("");
  };

  return (
    <FormModal isOpen onOpenChange={onOpenChange} title="Filters" size="lg">
      <Modal.Body>
        <div className="space-y-5 py-1">
          <FormField label="Job type">
            <JobSingleAutocomplete
              value={jobType}
              options={JOB_TYPES}
              placeholder="All job types"
              searchPlaceholder="Search job types"
              onChange={setJobType}
            />
          </FormField>

          <FormField label="Campus">
            <MultiAutocomplete
              value={campuses}
              options={USP_CAMPUSES}
              placeholder="All campuses"
              searchPlaceholder="Search campuses"
              onChange={setCampuses}
            />
          </FormField>

          <FormField label="Status">
            <JobSingleAutocomplete
              value={status}
              options={ADMIN_STATUS_OPTIONS}
              placeholder="All statuses"
              searchPlaceholder="Search statuses"
              onChange={setStatus}
            />
          </FormField>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <Button.Root
            type="button"
            variant="ghost"
            onPress={clearAll}
            className="text-zinc-600"
          >
            <Trash2Icon className="size-4" />
            Clear all
          </Button.Root>
          <div className="flex items-center gap-3">
            <Button.Root
              type="button"
              variant="ghost"
              onPress={() => onOpenChange(false)}
              className="text-zinc-600"
            >
              Cancel
            </Button.Root>
            <Button.Root
              type="button"
              onPress={applyFilters}
              className="rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Apply Filters
            </Button.Root>
          </div>
        </div>
      </Modal.Footer>
    </FormModal>
  );
}
