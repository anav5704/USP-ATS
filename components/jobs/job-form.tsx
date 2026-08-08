"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Checkbox, Input, Modal, TextArea } from "@heroui/react";
import { CheckIcon, LoaderCircleIcon, PlusIcon, SaveIcon } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { USP_CAMPUSES } from "@/lib/jobs/job-constants";
import { jobInputSchema, type JobInput } from "@/lib/jobs/job-schema";
import { useSaveJob } from "@/components/jobs/use-save-job";

const EMPTY_JOB: JobInput = {
  title: "",
  department: "",
  jobType: "",
  campus: [],
  gpaMin: null,
  degree: "",
  skills: "",
  hours: undefined as unknown as number,
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
    setValue,
    formState: { errors },
  } = useForm<JobInput>({
    resolver: zodResolver(jobInputSchema),
    defaultValues: initialData ?? EMPTY_JOB,
  });
  const { isPending, saveAsync } = useSaveJob(mode, jobId);
  const selectedCampuses = useWatch({ control, name: "campus" });

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const toggleCampus = (campus: (typeof USP_CAMPUSES)[number], selected: boolean) => {
    const next = selected
      ? [...selectedCampuses, campus]
      : selectedCampuses.filter((item) => item !== campus);
    setValue("campus", next, { shouldDirty: true, shouldValidate: true });
  };

  const submit = handleSubmit(async (values) => {
    const result = await saveAsync(values);
    if (result.success) onSuccess();
  });

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <Modal.Body>
        <div className="space-y-5 py-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="title" label="Job title" error={errors.title?.message}>
              <Input.Root id="title" fullWidth placeholder="e.g. Student Research Assistant" {...register("title")} />
            </FormField>
            <FormField id="department" label="Department" error={errors.department?.message}>
              <Input.Root id="department" fullWidth placeholder="e.g. School of Computing" {...register("department")} />
            </FormField>
            <FormField id="jobType" label="Job type" error={errors.jobType?.message}>
              <Input.Root id="jobType" fullWidth placeholder="e.g. Part-time" {...register("jobType")} />
            </FormField>
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
          </div>

          <FormField label="Campus" error={errors.campus?.message} hint="Select every campus where this role is available.">
            <div className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-2">
              {USP_CAMPUSES.map((campus) => (
                <Checkbox.Root
                  key={campus}
                  isSelected={selectedCampuses.includes(campus)}
                  onChange={(selected) => toggleCampus(campus, selected)}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator>
                        {({ isSelected }) =>
                          isSelected ? <CheckIcon className="size-3" /> : null
                        }
                      </Checkbox.Indicator>
                    </Checkbox.Control>
                    {campus}
                  </Checkbox.Content>
                </Checkbox.Root>
              ))}
            </div>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <FormField id="deadline" label="Application deadline" error={errors.deadline?.message}>
              <Input.Root id="deadline" type="datetime-local" fullWidth {...register("deadline")} />
            </FormField>
          </div>

          <FormField id="degree" label="Degree requirement (optional)" error={errors.degree?.message}>
            <Input.Root id="degree" fullWidth placeholder="e.g. Enrolled in a computing degree" {...register("degree")} />
          </FormField>

          <FormField id="skills" label="Skills requirement (optional)" error={errors.skills?.message}>
            <TextArea.Root id="skills" rows={3} fullWidth placeholder="Describe the skills needed for this role" {...register("skills")} />
          </FormField>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-end">
          <Button.Root
            type="submit"
            isDisabled={isPending}
            className="rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            {isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <PlusIcon className="size-4" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            {mode === "create" ? "Create posting" : "Save changes"}
          </Button.Root>
        </div>
      </Modal.Footer>
    </form>
  );
}
