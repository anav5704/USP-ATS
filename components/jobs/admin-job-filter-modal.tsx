"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@heroui/react";
import { Trash2Icon } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField } from "@/components/ui/form-field";
import { JobSingleAutocomplete } from "@/components/jobs/job-single-autocomplete";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import { SkillAutocomplete } from "@/components/ui/skill-autocomplete";
import { JOB_TYPES, USP_CAMPUSES_CENTRES } from "@/lib/jobs/job-constants";
import { USP_DEGREES } from "@/lib/usp-degrees";
import { SKILL_GROUPS } from "@/lib/profile/skill-groups";
import { gpaFilterSchema } from "@/lib/jobs/gpa-filter-schema";

export const ADMIN_STATUS_OPTIONS = ["Active", "Archived", "Expired"] as const;

export type AdminJobFilters = {
  jobType: string;
  campuses: string[];
  gpaMin: string;
  degrees: string[];
  skills: string[];
  status: string;
};

export const EMPTY_ADMIN_FILTERS: AdminJobFilters = {
  jobType: "",
  campuses: [],
  gpaMin: "",
  degrees: [],
  skills: [],
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
  const [gpaMin, setGpaMin] = useState(filters.gpaMin);
  const [degrees, setDegrees] = useState(filters.degrees);
  const [skills, setSkills] = useState(filters.skills);
  const [status, setStatus] = useState(filters.status);
  const gpaValidation = gpaFilterSchema.safeParse(gpaMin);
  const gpaError = gpaValidation.success ? undefined : gpaValidation.error.issues[0]?.message;

  const applyFilters = () => {
    if (!gpaValidation.success) return;
    onApply({ jobType, campuses, gpaMin: gpaValidation.data, degrees, skills, status });
    onOpenChange(false);
  };

  const clearAll = () => {
    setJobType("");
    setCampuses([]);
    setGpaMin("");
    setDegrees([]);
    setSkills([]);
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Campus/Centre">
              <MultiAutocomplete
                value={campuses}
                options={USP_CAMPUSES_CENTRES}
                placeholder="All campuses and centres"
                searchPlaceholder="Search campuses and centres"
                onChange={setCampuses}
              />
            </FormField>

            <FormField
              id="gpaMin"
              label="GPA Required"
              error={gpaError}
            >
              <Input.Root
                id="gpaMin"
                type="number"
                min={0}
                max={4.5}
                step="0.1"
                fullWidth
                placeholder="e.g. 3.0"
                value={gpaMin}
                onChange={(event) => setGpaMin(event.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Qualification">
            <MultiAutocomplete
              value={degrees}
              optionGroups={USP_DEGREES}
              placeholder="All qualifications"
              searchPlaceholder="Search qualifications"
              onChange={setDegrees}
            />
          </FormField>

          <FormField label="Skills">
            <SkillAutocomplete
              value={skills}
              groups={SKILL_GROUPS}
              placeholder="All skills"
              searchPlaceholder="Search skills"
              emptyMessage="No skills found"
              maxItems={10}
              onChange={setSkills}
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
        <div className="flex w-full items-center justify-between gap-3 pt-4">
          <Button.Root
            type="button"
            variant="ghost"
            onPress={clearAll}
            className="rounded-field text-muted"
          >
            <Trash2Icon className="size-4" />
            Clear All
          </Button.Root>
          <div className="flex items-center gap-3">
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
