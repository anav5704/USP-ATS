"use client";

import { useState, type KeyboardEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@heroui/react";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from "lucide-react";
import {
  profileInputSchema,
  type ProfileInput,
} from "@/lib/profile/profile-schema";
import { PROFILE_SECTIONS } from "@/components/profile/profile-sections";
import { ProfileStepper } from "@/components/profile/profile-stepper";
import { GeneralFields, type GeneralUser } from "@/components/profile/general-fields";
import { AcademicFields } from "@/components/profile/academic-fields";
import { CertificatesFields } from "@/components/profile/certificates-fields";
import { LinksFields } from "@/components/profile/links-fields";
import { useProfileSave } from "@/components/profile/use-profile-save";

const EMPTY_PROFILE: ProfileInput = {
  phone: "",
  bio: "",
  campuses: [],
  title: "",
  degreeStatus: "in_progress",
  gpa: undefined as unknown as number,
  skills: [],
  degrees: [],
  transcript: null,
  certificates: [],
  socialLinks: [],
  projectLinks: [],
};

const SECTION_COMPONENTS = [
  AcademicFields,
  CertificatesFields,
  LinksFields,
];

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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);

  const isLastSection = currentIndex === PROFILE_SECTIONS.length - 1;
  const CurrentFields =
    SECTION_COMPONENTS[Math.max(0, currentIndex - 1)];

  const advance = async () => {
    const section = PROFILE_SECTIONS[currentIndex];
    const valid = await form.trigger(section.fields);
    if (!valid) return;
    const next = Math.min(currentIndex + 1, PROFILE_SECTIONS.length - 1);
    setCurrentIndex(next);
    setMaxVisited((visited) => Math.max(visited, next));
  };

  const goBack = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  const goTo = (index: number) => {
    if (index > maxVisited) return;
    setCurrentIndex(index);
  };

  const handleSave = async (values: ProfileInput) => {
    save(values);
    onSuccess?.();
  };

  const onSubmit = form.handleSubmit(handleSave);

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement;
    if (target instanceof HTMLTextAreaElement) return;
    if (target instanceof HTMLButtonElement) return;
    event.preventDefault();
    if (!isLastSection) {
      void advance();
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} onKeyDown={handleKeyDown} noValidate className="space-y-6">
        <div className="min-w-0 space-y-4">
          <ProfileStepper
            currentIndex={currentIndex}
            maxVisitedIndex={maxVisited}
            onStepClick={goTo}
          />
          {currentIndex === 0 ? (
            <GeneralFields user={user} />
          ) : (
            <CurrentFields />
          )}
        </div>
        <div className="flex w-full items-center justify-between gap-3">
          <Button.Root
            type="button"
            variant="ghost"
            isDisabled={currentIndex === 0 || isPending}
            onPress={goBack}
            className="text-zinc-600"
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Button.Root>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium tabular-nums text-zinc-500">
              Step {currentIndex + 1} of {PROFILE_SECTIONS.length}
            </span>
            {isLastSection ? (
              <Button.Root
                type="button"
                isDisabled={isPending}
                onPress={() => void form.handleSubmit(handleSave)()}
                className="rounded-field bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                {isPending ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <SparklesIcon className="size-4" />
                )}
                Create Profile
              </Button.Root>
            ) : (
              <Button.Root
                type="button"
                isDisabled={isPending}
                onPress={advance}
                className="rounded-field bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                Next
                <ChevronRightIcon className="size-4" />
              </Button.Root>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}