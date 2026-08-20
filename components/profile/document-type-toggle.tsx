"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "transcript", label: "Transcript" },
  { value: "degree", label: "Degree" },
] as const;

export function DocumentTypeField({ index }: { index: number }) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();

  return (
    <FormField
      label="Document type"
      error={errors.degrees?.[index]?.documentType?.message}
    >
      <Controller
        name={`degrees.${index}.documentType`}
        control={control}
        render={({ field }) => (
          <select
            value={field.value}
            onChange={(e) =>
              field.onChange(e.target.value as "transcript" | "degree")
            }
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      />
    </FormField>
  );
}