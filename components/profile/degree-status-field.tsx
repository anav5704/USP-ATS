"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";

const DEGREE_STATUS_OPTIONS = ["in_progress", "completed"] as const;

export function DegreeStatusField() {
  const { control, formState: { errors } } = useFormContext<ProfileInput>();

  return (
    <FormField
      label="Degree status"
      error={errors.degreeStatus?.message}
      hint="Transcript is required for both statuses"
    >
      <Controller
        name="degreeStatus"
        control={control}
        render={({ field }) => (
          <ToggleButtonGroup
            fullWidth
            isDetached
            selectedKeys={[field.value]}
            onSelectionChange={(keys) => {
              const value = [...keys].pop();
              if (
                value === "in_progress" ||
                value === "completed"
              ) {
                field.onChange(value);
              }
            }}
          >
            {DEGREE_STATUS_OPTIONS.map((option) => (
              <ToggleButton
                key={option}
                id={option}
                className="data-selected:bg-zinc-900 data-selected:text-white"
              >
                {option === "in_progress" ? "In progress" : "Completed"}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      />
    </FormField>
  );
}