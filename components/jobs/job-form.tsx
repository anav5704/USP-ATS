"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal, TextArea } from "@heroui/react";
import { LoaderCircleIcon, PlusIcon, SaveIcon } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import {
  JOB_TITLES,
  JOB_TYPES,
  USP_CAMPUSES,
  USP_DEPARTMENTS,
} from "@/lib/jobs/job-constants";
import { jobInputSchema, type JobInput } from "@/lib/jobs/job-schema";
import { useSaveJob } from "@/components/jobs/use-save-job";
import { JobSingleAutocomplete } from "@/components/jobs/job-single-autocomplete";
import { JobMultipleAutocomplete } from "@/components/jobs/job-multiple-autocomplete";
import { USP_DEGREES } from "@/lib/usp-degrees";
import { SKILL_GROUPS } from "@/lib/profile/skill-groups";
import { JobDeadlineField } from "@/components/jobs/job-deadline-field";
import { SkillAutocomplete } from "@/components/ui/skill-autocomplete";

const EMPTY_JOB: JobInput = {
  title: "",
  description: "",
  department: undefined as unknown as JobInput["department"],
  jobType: undefined as unknown as JobInput["jobType"],
  campus: [],
  gpaMin: null,
  degree: [],
  skills: [],
  hours: undefined as unknown as number,
  hourlyPay: undefined as unknown as number,
  deadline: "",
};

export function JobForm({
  mode,
  jobId,
  initialData,
  onSuccess,
  onPendingChange,
}: {
  mode: "create" | "update";
  jobId?: string;
  initialData?: JobInput;
  onSuccess: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JobInput>({
    resolver: zodResolver(jobInputSchema),
    defaultValues: initialData ?? EMPTY_JOB,
  });
  const { isPending, saveAsync } = useSaveJob(mode, jobId);
  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const submit = handleSubmit(async (values) => {
    try {
      await saveAsync(values);
      onSuccess();
    } catch {
      // error toast is shown by useSaveJob
    }
  });

  return (
    <form onSubmit={submit} noValidate className="mt-5 flex min-h-0 flex-1 flex-col">
      <Modal.Body>
        <div className="space-y-5 py-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Job title" error={errors.title?.message}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <JobSingleAutocomplete
                    value={field.value}
                    options={JOB_TITLES}
                    placeholder="Select a job title"
                    searchPlaceholder="Search job titles"
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
            <FormField label="Job type" error={errors.jobType?.message}>
              <Controller
                name="jobType"
                control={control}
                render={({ field }) => (
                  <JobSingleAutocomplete
                    value={field.value ?? ""}
                    options={JOB_TYPES}
                    placeholder="Select a job type"
                    searchPlaceholder="Search job types"
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
          </div>

          <FormField id="description" label="Job description" error={errors.description?.message}>
            <TextArea.Root
              id="description"
              rows={4}
              fullWidth
              placeholder="Describe what the successful applicant will do"
              {...register("description")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Department" error={errors.department?.message}>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <JobSingleAutocomplete
                    value={field.value ?? ""}
                    options={USP_DEPARTMENTS}
                    placeholder="Select a department"
                    searchPlaceholder="Search departments"
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
            <FormField id="gpaMin" label="Minimum GPA (optional)" error={errors.gpaMin?.message}>
              <Input.Root
                id="gpaMin"
                type="number"
                min={0}
                max={4.5}
                step="0.01"
                fullWidth
                placeholder="e.g. 3.0"
                {...register("gpaMin", {
                  setValueAs: (value) => value === "" ? null : Number(value),
                })}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Campus" error={errors.campus?.message}>
              <Controller
                name="campus"
                control={control}
                render={({ field }) => (
                  <JobMultipleAutocomplete
                    value={field.value}
                    options={USP_CAMPUSES}
                    placeholder="Select one or more campuses"
                    searchPlaceholder="Search campuses"
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>

            <Controller
              name="deadline"
              control={control}
              render={({ field }) => (
                <JobDeadlineField
                  value={field.value}
                  error={errors.deadline?.message}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="hours" label="Hours per week" error={errors.hours?.message}>
              <Input.Root
                id="hours"
                type="number"
                min={1}
                max={168}
                fullWidth
                placeholder="e.g. 10"
                {...register("hours", {
                  setValueAs: (value) => value === "" ? undefined : Number(value),
                })}
              />
            </FormField>
            <FormField id="hourlyPay" label="Hourly pay" error={errors.hourlyPay?.message}>
              <Input.Root
                id="hourlyPay"
                type="number"
                min={0}
                step="0.01"
                fullWidth
                placeholder="e.g. 12.50"
                {...register("hourlyPay", {
                  setValueAs: (value) => value === "" ? undefined : Number(value),
                })}
              />
            </FormField>
          </div>

          <FormField label="Degree requirement (optional)" error={errors.degree?.message}>
            <Controller
              name="degree"
              control={control}
              render={({ field }) => (
                <JobMultipleAutocomplete
                  value={field.value}
                  optionGroups={USP_DEGREES}
                  placeholder="Select one or more degrees"
                  searchPlaceholder="Search degrees"
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>

          <FormField label="Skills requirement (optional)" error={errors.skills?.message}>
            <Controller
              name="skills"
              control={control}
              render={({ field }) => (
                <SkillAutocomplete
                  value={field.value}
                  groups={SKILL_GROUPS}
                  placeholder="Select up to 10 skills"
                  searchPlaceholder="Search skills"
                  emptyMessage="No skills found"
                  maxItems={10}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-end">
          <Button.Root
            type="submit"
            isDisabled={isPending}
            className="rounded-field bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            {isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <PlusIcon className="size-4" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            {mode === "create" ? "Create Posting" : "Save Changes"}
          </Button.Root>
        </div>
      </Modal.Footer>
    </form>
  );
}
