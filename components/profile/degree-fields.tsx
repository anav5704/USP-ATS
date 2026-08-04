"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";
import { GraduationCapIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/profile/form-field";
import { RepeaterItem } from "@/components/profile/repeater-item";
import { RepeaterSection } from "@/components/profile/repeater-section";

export function DegreeFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "degrees",
  });

  return (
    <RepeaterSection
      icon={GraduationCapIcon}
      title="Degrees"
      description="Add every degree you are currently pursuing or have completed."
      addLabel="Add degree"
      onAdd={() => append({ name: "", institution: "" })}
    >
      {fields.map((field, index) => (
        <RepeaterItem
          key={field.id}
          title="Degree"
          index={index}
          canRemove={fields.length > 1}
          onRemove={() => remove(index)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id={`degrees.${index}.name`}
              label="Degree name"
              error={errors.degrees?.[index]?.name?.message}
            >
              <Input.Root
                id={`degrees.${index}.name`}
                fullWidth
                placeholder="e.g. Bachelor of Science"
                {...register(`degrees.${index}.name`)}
              />
            </FormField>
            <FormField
              id={`degrees.${index}.institution`}
              label="Institution (optional)"
              error={errors.degrees?.[index]?.institution?.message}
            >
              <Input.Root
                id={`degrees.${index}.institution`}
                fullWidth
                placeholder="e.g. University of the South Pacific"
                {...register(`degrees.${index}.institution`)}
              />
            </FormField>
          </div>
        </RepeaterItem>
      ))}
    </RepeaterSection>
  );
}
