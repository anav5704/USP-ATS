"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";
import { BookOpenIcon, GraduationCapIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { SkillAutocomplete } from "@/components/ui/skill-autocomplete";
import { SKILL_GROUPS } from "@/lib/profile/skill-groups";
import { DegreeStatusField } from "@/components/profile/degree-status-field";
import { FileUploadField } from "@/components/profile/file-upload-field";
import { RepeaterItem } from "@/components/profile/repeater-item";
import { RepeaterSection } from "@/components/profile/repeater-section";

export function AcademicFields() {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProfileInput>();

  const degrees = watch("degrees");

  const addDegree = () => {
    setValue("degrees", [...degrees, ""], { shouldValidate: true });
  };

  const removeDegree = (index: number) => {
    setValue("degrees", degrees.filter((_, i) => i !== index), {
      shouldValidate: true,
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
          <BookOpenIcon className="size-5" />
        </span>
        <h2 className="text-sm font-semibold text-zinc-900">
          Academic details
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="gpa"
          label="Average GPA"
          error={errors.gpa?.message}
          hint="Out of 4.5, up to 2 decimal places"
        >
          <Input.Root
            id="gpa"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={4.5}
            placeholder="e.g. 3.8"
            fullWidth
            {...register("gpa", {
              setValueAs: (value) =>
                value === "" ? undefined : Number(value),
            })}
          />
        </FormField>
        <DegreeStatusField />
      </div>
      <div className="mt-4">
        <Controller
          name="transcript"
          control={control}
          render={({ field }) => (
            <FileUploadField
              label="Transcript"
              value={field.value}
              error={errors.transcript?.message}
              hint="Required. PDF preferred, max 10 MB."
              onChange={field.onChange}
            />
          )}
        />
      </div>
      <div className="mt-4">
        <RepeaterSection
          icon={GraduationCapIcon}
          title="Degrees"
          addLabel="Add degree"
          onAdd={addDegree}
        >
          {degrees.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No degrees yet. Add the degrees you are studying or have completed.
            </p>
          ) : (
            degrees.map((degree, index) => (
              <RepeaterItem
                key={`${degree}-${index}`}
                title="Degree"
                index={index}
                canRemove={degrees.length > 1}
                onRemove={() => removeDegree(index)}
              >
                <FormField
                  id={`degrees.${index}`}
                  label="Degree title"
                  error={errors.degrees?.[index]?.message}
                >
                  <Input.Root
                    id={`degrees.${index}`}
                    fullWidth
                    placeholder="e.g. Bachelor of Science (Computer Science)"
                    {...register(`degrees.${index}`)}
                  />
                </FormField>
              </RepeaterItem>
            ))
          )}
        </RepeaterSection>
      </div>
      <div className="mt-4">
        <FormField
          label="Skills"
          error={errors.skills?.message}
        >
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
    </section>
  );
}