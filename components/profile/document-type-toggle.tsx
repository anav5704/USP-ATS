"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";

const DOCUMENT_TYPE_OPTIONS = ["transcript", "degree"] as const;

export function DocumentTypeField({ index }: { index: number }) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();

  return (
    <FormField
      label="Document type"
      error={errors.degrees?.[index]?.documentType?.message}
      hint="Flag this upload as a transcript or the degree itself"
    >
      <Controller
        name={`degrees.${index}.documentType`}
        control={control}
        render={({ field }) => (
          <ToggleButtonGroup
            fullWidth
            isDetached
            selectedKeys={[field.value]}
            onSelectionChange={(keys) => {
              const value = [...keys].pop();
              if (value === "transcript" || value === "degree") {
                field.onChange(value);
              }
            }}
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <ToggleButton
                key={option}
                id={option}
                className="data-selected:bg-zinc-900 data-selected:text-white"
              >
                {option === "transcript" ? "Transcript" : "Degree"}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      />
    </FormField>
  );
}