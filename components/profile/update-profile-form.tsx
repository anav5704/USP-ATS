"use client";

import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Tabs } from "@heroui/react";
import { LoaderCircleIcon, SaveIcon } from "lucide-react";
import {
  profileInputSchema,
  type ProfileInput,
} from "@/lib/profile/profile-schema";
import {
  PROFILE_SECTIONS,
  type SectionId,
} from "@/components/profile/profile-sections";
import { AcademicFields } from "@/components/profile/academic-fields";
import { DegreeFields } from "@/components/profile/degree-fields";
import { EducationFields } from "@/components/profile/education-fields";
import { ProjectFields } from "@/components/profile/project-fields";
import { useProfileSave } from "@/components/profile/use-profile-save";

const SECTION_COMPONENTS: Record<SectionId, () => React.ReactElement> = {
  academic: AcademicFields,
  degrees: DegreeFields,
  education: EducationFields,
  projects: ProjectFields,
};

export function UpdateProfileForm({
  initialData,
  onSuccess,
  onPendingChange,
}: {
  initialData?: ProfileInput;
  onSuccess?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: initialData,
  });
  const { isPending, saveAsync } = useProfileSave("update");

  const [selectedTab, setSelectedTab] = useState<SectionId>("academic");

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const handleSave = async (values: ProfileInput) => {
    const result = await saveAsync(values);
    if (result.success) {
      onSuccess?.();
    }
  };

  const onSubmit = form.handleSubmit(handleSave);

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <Modal.Body>
          <div className="min-w-0">
            <div className="space-y-4">
              <Tabs.Root
                selectedKey={selectedTab}
                onSelectionChange={(key) => {
                  if (typeof key === "string") {
                    setSelectedTab(key as SectionId);
                  }
                }}
              >
                <Tabs.ListContainer>
                  <Tabs.List className="w-full">
                    {PROFILE_SECTIONS.map((section) => (
                      <Tabs.Tab
                        key={section.id}
                        id={section.id}
                        className="gap-2 data-selected:bg-white data-selected:text-zinc-900"
                      >
                        <section.icon className="size-4 shrink-0" />
                        {section.shortLabel}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs.ListContainer>
                {PROFILE_SECTIONS.map((section) => {
                  const Fields = SECTION_COMPONENTS[section.id];
                  return (
                    <Tabs.Panel key={section.id} id={section.id}>
                      <Fields />
                    </Tabs.Panel>
                  );
                })}
              </Tabs.Root>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full items-center justify-end gap-3">
            <Button.Root
              type="button"
              isDisabled={isPending}
              onPress={() => void form.handleSubmit(handleSave)()}
              className="rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              {isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
              Save changes
            </Button.Root>
          </div>
        </Modal.Footer>
      </form>
    </FormProvider>
  );
}