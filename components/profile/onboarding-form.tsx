"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Tabs, toast } from "@heroui/react";
import { LoaderCircleIcon, SparklesIcon } from "lucide-react";
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

const EMPTY_PROFILE: ProfileInput = {
  phone: "",
  bio: "",
  campuses: [],
  skills: [],
  degrees: [
    {
      name: "",
      gpa: undefined as unknown as number,
      documentType: "transcript",
      document: null,
    },
  ],
  certificates: [],
  socialLinks: [],
  projectLinks: [],
};

const SECTION_COMPONENTS: Record<
  SectionId,
  React.ComponentType<{ user?: GeneralUser | null }>
> = {
  general: GeneralFields,
  academic: AcademicFields,
  certificates: CertificatesFields,
  links: LinksFields,
};

export function OnboardingForm({
  user,
  onSuccess,
}: {
  user?: GeneralUser | null;
  onSuccess?: () => void;
}) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: EMPTY_PROFILE,
  });
  const { isPending, save } = useProfileSave("create");

  const [selectedTab, setSelectedTab] = useState<SectionId>("general");

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
    save(form.getValues());
    onSuccess?.();
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSaveClick();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Tabs.Root
          selectedKey={selectedTab}
          onSelectionChange={(key) => {
            if (typeof key === "string") {
              setSelectedTab(key as SectionId);
            }
          }}
        >
          <Tabs.ListContainer className="sticky top-0 z-10 rounded-field bg-background">
            <Tabs.List className="w-full">
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
        <div className="flex w-full items-center justify-end gap-3">
          <Button.Root
            type="button"
            isDisabled={isPending}
            onPress={() => void handleSaveClick()}
            className="rounded-field bg-foreground px-5 text-sm font-medium text-background transition-colors hover:opacity-90"
          >
            {isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <SparklesIcon className="size-4" />
            )}
            Create Profile
          </Button.Root>
        </div>
      </form>
    </FormProvider>
  );
}