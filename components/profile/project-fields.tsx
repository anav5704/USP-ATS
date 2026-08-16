"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Input, TextArea } from "@heroui/react";
import { FolderGit2Icon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { RepeaterItem } from "@/components/profile/repeater-item";
import { RepeaterSection } from "@/components/profile/repeater-section";

export function ProjectFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "projects",
  });

  return (
    <RepeaterSection
      icon={FolderGit2Icon}
      title="Personal projects"
      addLabel="Add project"
      onAdd={() => append({ name: "", description: "", link: "" })}
    >
      {fields.map((field, index) => (
        <RepeaterItem
          key={field.id}
          title="Project"
          index={index}
          onRemove={() => remove(index)}
        >
          <div className="space-y-4">
            <FormField
              id={`projects.${index}.name`}
              label="Project name"
              error={errors.projects?.[index]?.name?.message}
            >
              <Input.Root
                id={`projects.${index}.name`}
                fullWidth
                placeholder="e.g. Weather app"
                {...register(`projects.${index}.name`)}
              />
            </FormField>
            <FormField
              id={`projects.${index}.description`}
              label="Description (optional)"
              error={errors.projects?.[index]?.description?.message}
            >
              <TextArea.Root
                id={`projects.${index}.description`}
                rows={2}
                fullWidth
                placeholder="What did you build and what did you learn?"
                {...register(`projects.${index}.description`)}
              />
            </FormField>
            <FormField
              id={`projects.${index}.link`}
              label="Link (optional)"
              error={errors.projects?.[index]?.link?.message}
            >
              <Input.Root
                id={`projects.${index}.link`}
                fullWidth
                placeholder="https://github.com/yourname/project"
                {...register(`projects.${index}.link`)}
              />
            </FormField>
          </div>
        </RepeaterItem>
      ))}
    </RepeaterSection>
  );
}
