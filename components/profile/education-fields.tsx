"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";
import { SchoolIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/profile/form-field";
import { RepeaterItem } from "@/components/profile/repeater-item";
import { RepeaterSection } from "@/components/profile/repeater-section";

export function EducationFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  return (
    <RepeaterSection
      icon={SchoolIcon}
      title="Education history"
      description="Add your education history, from high school onwards."
      addLabel="Add entry"
      onAdd={() => append({ institution: "", program: "" })}
    >
      {fields.map((field, index) => (
        <RepeaterItem
          key={field.id}
          title="Entry"
          index={index}
          canRemove={fields.length > 1}
          onRemove={() => remove(index)}
        >
          <div className="space-y-4">
            <FormField
              id={`education.${index}.institution`}
              label="Institution"
              error={errors.education?.[index]?.institution?.message}
            >
              <Input.Root
                id={`education.${index}.institution`}
                fullWidth
                placeholder="e.g. USP Grammar School"
                {...register(`education.${index}.institution`)}
              />
            </FormField>
            <FormField
              id={`education.${index}.program`}
              label="Program or course (optional)"
              error={errors.education?.[index]?.program?.message}
            >
              <Input.Root
                id={`education.${index}.program`}
                fullWidth
                placeholder="e.g. Year 13 (High School)"
                {...register(`education.${index}.program`)}
              />
            </FormField>
          </div>
        </RepeaterItem>
      ))}
    </RepeaterSection>
  );
}
