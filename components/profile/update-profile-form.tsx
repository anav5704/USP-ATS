"use client";

import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Tabs, toast } from "@heroui/react";
import { LoaderCircleIcon, SaveIcon } from "lucide-react";
import {
  profileInputSchema,
  type ProfileInput,
} from "@/lib/profile/profile-schema";
import {
  PROFILE_SECTIONS,
  type SectionId,
} from "@/components/profile/profile-sections";
import { GeneralFields, type GeneralUser } from "@/components/profile/general-fields";
import { AcademicFields } from "@/components/profile/academic-fields";
import { CertificatesFields } from "@/components/profile/certificates-fields";
import { LinksFields } from "@/components/profile/links-fields";
import { useProfileSave } from "@/components/profile/use-profile-save";

const SECTION_COMPONENTS: Record<
  SectionId,
  React.ComponentType<{ user?: GeneralUser | null }>
> = {
  general: GeneralFields,
  academic: AcademicFields,
  certificates: CertificatesFields,
  links: LinksFields,
};

export function UpdateProfileForm({
  user,
  initialData,
  onSuccess,
  onPendingChange,
}: {
  user?: GeneralUser | null;
  initialData?: ProfileInput;
  onSuccess?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: initialData,
  });
  const { isPending, saveAsync } = useProfileSave("update");

  const [selectedTab, setSelectedTab] = useState<SectionId>("general");

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const handleSaveClick = async () => {
    const valid = await form.trigger();
    if (!valid) {
      const sectionWithErrors = PROFILE_SECTIONS.find((section) =>
        section.fields.some((field) => form.getFieldState(field).error)
      );
      if (sectionWithErrors) {
        setSelectedTab(sectionWithErrors.id);
        toast.danger(
          `Please fix the errors in ${sectionWithErrors.label} before saving.`
        );
      }
      return;
    }
    try {
      await saveAsync(form.getValues());
      onSuccess?.();
    } catch {
      // error toast is shown by useProfileSave
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSaveClick();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="mt-5 flex min-h-0 flex-1 flex-col">
        <Modal.Body>
          <Tabs.Root
            selectedKey={selectedTab}
            onSelectionChange={(key) => {
              if (typeof key === "string") {
                setSelectedTab(key as SectionId);
              }
            }}
          >
            <Tabs.ListContainer className="sticky top-0 z-10 rounded-field bg-background">
              <Tabs.List className="w-full overflow-x-auto">
                {PROFILE_SECTIONS.map((section) => (
                  <Tabs.Tab
                    key={section.id}
                    id={section.id}
                    className="gap-2 rounded-field data-selected:bg-surface data-selected:text-foreground"
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
                  {section.id === "general" ? (
                    <GeneralFields user={user} />
                  ) : (
                    <Fields />
                  )}
                </Tabs.Panel>
              );
            })}
          </Tabs.Root>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full items-center justify-end gap-3">
            <Button.Root
              type="button"
              isDisabled={isPending}
              onPress={() => void handleSaveClick()}
              className="w-full rounded-field bg-foreground px-5 text-sm font-medium text-background transition-colors hover:opacity-90 sm:w-auto"
            >
              {isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
              Save Changes
            </Button.Root>
          </div>
        </Modal.Footer>
      </form>
    </FormProvider>
  );
}
