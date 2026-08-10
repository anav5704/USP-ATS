"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";
import { BookOpenIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import { TagAutocomplete } from "@/components/ui/tag-autocomplete";
import { USP_DEGREES } from "@/lib/usp-degrees";
import { SKILL_GROUPS } from "@/lib/profile/skill-groups";

export function AcademicFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
          <BookOpenIcon className="size-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Academic details
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Select your degrees and enter your average GPA out of 4.5.
          </p>
        </div>
      </div>
      <FormField
        label="Degrees"
        error={errors.degrees?.message}
        hint="Select every degree you are pursuing or have completed."
      >
        <Controller
          name="degrees"
          control={control}
          render={({ field }) => (
            <MultiAutocomplete
              value={field.value}
              options={USP_DEGREES}
              placeholder="Select one or more degrees"
              searchPlaceholder="Search degrees"
              onChange={field.onChange}
            />
          )}
        />
      </FormField>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField id="gpa" label="Average GPA (out of 4.5)" error={errors.gpa?.message}>
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
      </div>
      <div className="mt-4">
        <FormField
          label="Skills"
          error={errors.skills?.message}
          hint="Select up to 10 skills that apply to you."
        >
          <Controller
            name="skills"
            control={control}
            render={({ field }) => (
              <TagAutocomplete
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