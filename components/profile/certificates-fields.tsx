"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";
import { AwardIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { RepeaterItem } from "@/components/profile/repeater-item";
import { RepeaterSection } from "@/components/profile/repeater-section";
import { FileUploadField } from "@/components/profile/file-upload-field";

function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CertificatesFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "certificates",
  });

  return (
    <RepeaterSection
      icon={AwardIcon}
      title="Certificates"
      addLabel="Add certificate"
      onAdd={() =>
        append({
          label: "",
          uploadedAt: todayInputValue(),
          file: null,
        })
      }
    >
      {fields.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No certificates yet. Add one to show your achievements.
        </p>
      ) : (
        fields.map((field, index) => (
          <RepeaterItem
            key={field.id}
            title="Certificate"
            index={index}
            onRemove={() => remove(index)}
          >
            <div className="space-y-4">
              <FormField
                id={`certificates.${index}.label`}
                label="Name or label"
                error={errors.certificates?.[index]?.label?.message}
              >
                <Input.Root
                  id={`certificates.${index}.label`}
                  fullWidth
                  placeholder="e.g. Certified Peer Tutor"
                  {...register(`certificates.${index}.label`)}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id={`certificates.${index}.uploadedAt`}
                  label="Date obtained"
                  error={errors.certificates?.[index]?.uploadedAt?.message}
                >
                  <Input.Root
                    id={`certificates.${index}.uploadedAt`}
                    type="date"
                    fullWidth
                    {...register(`certificates.${index}.uploadedAt`)}
                  />
                </FormField>
                <Controller
                  name={`certificates.${index}.file`}
                  control={control}
                  render={({ field }) => (
                    <FileUploadField
                      label="Certificate file"
                      value={field.value}
                      error={errors.certificates?.[index]?.file?.message}
                      hint="PDF or image, max 10 MB"
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </RepeaterItem>
        ))
      )}
    </RepeaterSection>
  );
}