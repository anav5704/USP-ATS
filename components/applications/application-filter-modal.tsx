"use client";

import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Trash2Icon } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField } from "@/components/ui/form-field";
import { JobSingleAutocomplete } from "@/components/jobs/job-single-autocomplete";
import { APPLICATION_STATUS_LABELS } from "@/components/applications/application-status-badge";

export const APPLICATION_STATUS_OPTIONS = Object.values(
  APPLICATION_STATUS_LABELS
);

export type ApplicationFilters = {
  status: string;
};

export const EMPTY_APPLICATION_FILTERS: ApplicationFilters = {
  status: "",
};

export function ApplicationFilterModal({
  filters,
  onApply,
  onOpenChange,
}: {
  filters: ApplicationFilters;
  onApply: (filters: ApplicationFilters) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState(filters.status);

  const applyFilters = () => {
    onApply({ status });
    onOpenChange(false);
  };

  const clearAll = () => {
    setStatus("");
  };

  return (
    <FormModal isOpen onOpenChange={onOpenChange} title="Filters" size="lg">
      <Modal.Body>
        <div className="space-y-5 py-1">
          <FormField label="Application status">
            <JobSingleAutocomplete
              value={status}
              options={APPLICATION_STATUS_OPTIONS}
              placeholder="All statuses"
              searchPlaceholder="Search statuses"
              onChange={setStatus}
            />
          </FormField>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button.Root
            type="button"
            variant="ghost"
            onPress={clearAll}
            className="rounded-field text-muted"
          >
            <Trash2Icon className="size-4" />
            Clear All
          </Button.Root>
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:items-center">
            <Button.Root
              type="button"
              variant="ghost"
              onPress={() => onOpenChange(false)}
              className="rounded-field text-muted"
            >
              Cancel
            </Button.Root>
            <Button.Root
              type="button"
              onPress={applyFilters}
              className="rounded-field bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
            >
              Apply Filters
            </Button.Root>
          </div>
        </div>
      </Modal.Footer>
    </FormModal>
  );
}
