"use client";

import { useFormContext } from "react-hook-form";
import { Input, TextArea } from "@heroui/react";
import { BookOpenIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";

export function AcademicFields() {
  const {
    register,
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
            Your average GPA is measured out of 4.5.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
          id="skills"
          label="Technical skills"
          error={errors.skills?.message}
          hint="List the technologies, tools and other skills you have."
        >
          <TextArea.Root
            id="skills"
            rows={3}
            fullWidth
            placeholder="e.g. Python, JavaScript, Excel, Public speaking"
            {...register("skills")}
          />
        </FormField>
      </div>
    </section>
  );
}
