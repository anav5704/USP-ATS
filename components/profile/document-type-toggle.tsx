"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { JobSingleAutocomplete } from "@/components/jobs/job-single-autocomplete";

const DOCUMENT_TYPE_OPTIONS = ["Transcript", "Degree"] as const;

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
          <JobSingleAutocomplete
            value={field.value === "degree" ? "Degree" : "Transcript"}
            options={DOCUMENT_TYPE_OPTIONS}
            placeholder="Select document type"
            searchPlaceholder="Search document types"
            onChange={(label) =>
              field.onChange(label === "Degree" ? "degree" : "transcript")
            }
          />
        )}
      />
    </FormField>
  );
}