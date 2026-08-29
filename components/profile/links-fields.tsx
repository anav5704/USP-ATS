"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";
import { Link2Icon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { RepeaterItem } from "@/components/profile/repeater-item";
import { RepeaterSection } from "@/components/profile/repeater-section";

export function LinksFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();

  const social = useFieldArray({ control, name: "socialLinks" });
  const project = useFieldArray({ control, name: "projectLinks" });

  return (
    <div className="space-y-4">
      <RepeaterSection
        icon={Link2Icon}
        title="Social links"
        addLabel="Add link"
        onAdd={() => social.append({ platform: "", url: "" })}
      >
        {social.fields.length === 0 ? (
          <p className="text-sm text-muted">
            No social links yet. Add your LinkedIn, GitHub or other profiles.
          </p>
        ) : (
          social.fields.map((field, index) => (
            <RepeaterItem
              key={field.id}
              title="Link"
              index={index}
              onRemove={() => social.remove(index)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id={`socialLinks.${index}.platform`}
                  label="Platform"
                  error={errors.socialLinks?.[index]?.platform?.message}
                >
                  <Input.Root
                    id={`socialLinks.${index}.platform`}
                    fullWidth
                    placeholder="e.g. LinkedIn"
                    {...register(`socialLinks.${index}.platform`)}
                  />
                </FormField>
                <FormField
                  id={`socialLinks.${index}.url`}
                  label="URL"
                  error={errors.socialLinks?.[index]?.url?.message}
                >
                  <Input.Root
                    id={`socialLinks.${index}.url`}
                    fullWidth
                    placeholder="https://"
                    {...register(`socialLinks.${index}.url`)}
                  />
                </FormField>
              </div>
            </RepeaterItem>
          ))
        )}
      </RepeaterSection>

      <RepeaterSection
        icon={Link2Icon}
        title="Project links"
        addLabel="Add link"
        onAdd={() => project.append({ title: "", url: "" })}
      >
        {project.fields.length === 0 ? (
          <p className="text-sm text-muted">
            No project links yet. Share a portfolio, repo, or demo.
          </p>
        ) : (
          project.fields.map((field, index) => (
            <RepeaterItem
              key={field.id}
              title="Link"
              index={index}
              onRemove={() => project.remove(index)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id={`projectLinks.${index}.title`}
                  label="Title"
                  error={errors.projectLinks?.[index]?.title?.message}
                >
                  <Input.Root
                    id={`projectLinks.${index}.title`}
                    fullWidth
                    placeholder="e.g. Weather app"
                    {...register(`projectLinks.${index}.title`)}
                  />
                </FormField>
                <FormField
                  id={`projectLinks.${index}.url`}
                  label="URL"
                  error={errors.projectLinks?.[index]?.url?.message}
                >
                  <Input.Root
                    id={`projectLinks.${index}.url`}
                    fullWidth
                    placeholder="https://"
                    {...register(`projectLinks.${index}.url`)}
                  />
                </FormField>
              </div>
            </RepeaterItem>
          ))
        )}
      </RepeaterSection>
    </div>
  );
}