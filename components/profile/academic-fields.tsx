"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@heroui/react";
import { GraduationCapIcon } from "lucide-react";
import type { ProfileInput, DegreeInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { FileUploadField } from "@/components/profile/file-upload-field";
import { DocumentTypeField } from "@/components/profile/document-type-toggle";
import { RepeaterItem } from "@/components/profile/repeater-item";
import { RepeaterSection } from "@/components/profile/repeater-section";

export function AcademicFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "degrees",
  });

  const addDegree = () => {
    const empty: DegreeInput = {
      name: "",
      gpa: undefined as unknown as number,
      documentType: "transcript",
      document: null,
    };
    append(empty);
  };

  return (
    <RepeaterSection
      icon={GraduationCapIcon}
      title="Degrees"
      addLabel="Add degree"
      onAdd={addDegree}
    >
      {fields.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No degrees yet. Add the degrees you are studying or have completed.
        </p>
      ) : (
        fields.map((field, index) => (
          <RepeaterItem
            key={field.id}
            title="Degree"
            index={index}
            canRemove={fields.length > 1}
            onRemove={() => remove(index)}
          >
            <div className="space-y-4">
              <FormField
                id={`degrees.${index}.name`}
                label="Degree title"
                error={errors.degrees?.[index]?.name?.message}
              >
                <Input.Root
                  id={`degrees.${index}.name`}
                  fullWidth
                  placeholder="e.g. Bachelor of Science (Computer Science)"
                  {...register(`degrees.${index}.name`)}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id={`degrees.${index}.gpa`}
                  label="GPA for this degree"
                  error={errors.degrees?.[index]?.gpa?.message}
                  hint="Out of 4.5, up to 2 decimal places"
                >
                  <Input.Root
                    id={`degrees.${index}.gpa`}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    max={4.5}
                    placeholder="e.g. 3.8"
                    fullWidth
                    {...register(`degrees.${index}.gpa`, {
                      setValueAs: (value) =>
                        value === "" ? undefined : Number(value),
                    })}
                  />
                </FormField>
                <DocumentTypeField index={index} />
              </div>
              <Controller
                name={`degrees.${index}.document`}
                control={control}
                render={({ field }) => (
                  <FileUploadField
                    label="Transcript or degree"
                    value={field.value}
                    error={errors.degrees?.[index]?.document?.message}
                    hint="Required. PDF preferred, max 10 MB."
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </RepeaterItem>
        ))
      )}
    </RepeaterSection>
  );
}