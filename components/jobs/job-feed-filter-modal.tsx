"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@heroui/react";
import { Trash2Icon } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField } from "@/components/ui/form-field";
import { JobSingleAutocomplete } from "@/components/jobs/job-single-autocomplete";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import { SkillAutocomplete } from "@/components/ui/skill-autocomplete";
import { JOB_TYPES, USP_CAMPUSES } from "@/lib/jobs/job-constants";
import { USP_DEGREES } from "@/lib/usp-degrees";
import { SKILL_GROUPS } from "@/lib/profile/skill-groups";

export type JobFeedFilters = {
  jobType: string;
  campuses: string[];
  gpaMin: string;
  degrees: string[];
  skills: string[];
};

export const EMPTY_FEED_FILTERS: JobFeedFilters = {
  jobType: "",
  campuses: [],
  gpaMin: "",
  degrees: [],
  skills: [],
};

export function JobFeedFilterModal({
  filters,
  onApply,
  onOpenChange,
}: {
  filters: JobFeedFilters;
  onApply: (filters: JobFeedFilters) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [jobType, setJobType] = useState(filters.jobType);
  const [campuses, setCampuses] = useState(filters.campuses);
  const [gpaMin, setGpaMin] = useState(filters.gpaMin);
  const [degrees, setDegrees] = useState(filters.degrees);
  const [skills, setSkills] = useState(filters.skills);

  const applyFilters = () => {
    onApply({ jobType, campuses, gpaMin, degrees, skills });
    onOpenChange(false);
  };

  const clearAll = () => {
    setJobType("");
    setCampuses([]);
    setGpaMin("");
    setDegrees([]);
    setSkills([]);
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
            <FormField label="Campus">
              <MultiAutocomplete
                value={campuses}
                options={USP_CAMPUSES}
                placeholder="All campuses"
                searchPlaceholder="Search campuses"
                onChange={setCampuses}
              />
            </FormField>

            <FormField
              id="gpaMin"
              label="Minimum GPA"
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

          <FormField label="Degree">
            <MultiAutocomplete
              value={degrees}
              optionGroups={USP_DEGREES}
              placeholder="All degrees"
              searchPlaceholder="Search degrees"
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
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full items-center justify-between gap-3 pt-4">
          <Button.Root
            type="button"
            variant="ghost"
            onPress={clearAll}
            className="text-zinc-600"
          >
            <Trash2Icon className="size-4" />
            Clear All
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
              className="rounded-field bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Apply Filters
            </Button.Root>
          </div>
        </div>
      </Modal.Footer>
    </FormModal>
  );
}
