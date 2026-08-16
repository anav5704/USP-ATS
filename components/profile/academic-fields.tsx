"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";
import { BookOpenIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import { SkillAutocomplete } from "@/components/ui/skill-autocomplete";
import { JobSingleAutocomplete } from "@/components/jobs/job-single-autocomplete";
import { USP_DEGREES } from "@/lib/usp-degrees";
import { USP_CAMPUSES } from "@/lib/jobs/job-constants";
import { SKILL_GROUPS } from "@/lib/profile/skill-groups";

export function AcademicFields({
  campusVariant = "multi",
}: {
  campusVariant?: "single" | "multi";
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();

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
      <FormField
        label="Degrees"
        error={errors.degrees?.message}
      >
        <Controller
          name="degrees"
          control={control}
          render={({ field }) => (
            <MultiAutocomplete
              value={field.value}
              optionGroups={USP_DEGREES}
              placeholder="Select one or more degrees"
              searchPlaceholder="Search degrees"
              onChange={field.onChange}
            />
          )}
        />
      </FormField>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField
          label="Campus"
          error={errors.campuses?.message}
        >
          <Controller
            name="campuses"
            control={control}
            render={({ field }) =>
              campusVariant === "single" ? (
                <JobSingleAutocomplete
                  value={field.value[0] ?? ""}
                  options={USP_CAMPUSES}
                  placeholder="Select your campus"
                  searchPlaceholder="Search campuses"
                  onChange={(campus) =>
                    field.onChange(campus ? [campus] : [])
                  }
                />
              ) : (
                <MultiAutocomplete
                  value={field.value}
                  options={USP_CAMPUSES}
                  placeholder="Select one or more campuses"
                  searchPlaceholder="Search campuses"
                  onChange={field.onChange}
                />
              )
            }
          />
        </FormField>
        <FormField id="gpa" label="Average GPA" error={errors.gpa?.message}>
          <Input.Root
            id="gpa"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={4.5}
            placeholder="e.g. 3.8 (out of 4.5)"
            fullWidth
            {...register("gpa", {
              setValueAs: (value) =>
                value === "" ? undefined : Number(value),
            })}
          />
        </FormField>
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