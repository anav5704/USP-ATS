"use client";

import { useState, type KeyboardEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal } from "@heroui/react";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  SaveIcon,
  SparklesIcon,
} from "lucide-react";
import {
  profileInputSchema,
  type ProfileInput,
} from "@/lib/profile/profile-schema";
import { PROFILE_STEPS } from "@/components/profile/profile-steps";
import { ProfileStepper } from "@/components/profile/profile-stepper";
import { AccountInfoStrip } from "@/components/profile/account-info-strip";
import { AcademicFields } from "@/components/profile/academic-fields";
import { DegreeFields } from "@/components/profile/degree-fields";
import { EducationFields } from "@/components/profile/education-fields";
import { ProjectFields } from "@/components/profile/project-fields";
import { useProfileSave } from "@/components/profile/use-profile-save";

const EMPTY_PROFILE: ProfileInput = {
  gpa: undefined as unknown as number,
  skills: "",
  degrees: [{ name: "", institution: "" }],
  education: [{ institution: "", program: "" }],
  projects: [],
};

const STEP_COMPONENTS = [
  AcademicFields,
  DegreeFields,
  EducationFields,
  ProjectFields,
];

export function ProfileWizard({
  mode,
  initialData,
  onSuccess,
  variant,
  accountInfo,
}: {
  mode: "create" | "update";
  initialData?: ProfileInput;
  onSuccess?: () => void;
  variant: "page" | "modal";
  accountInfo?: { name: string; email: string };
}) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: initialData ?? EMPTY_PROFILE,
  });
  const { isPending, save } = useProfileSave(mode);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);

  const isLastStep = currentIndex === PROFILE_STEPS.length - 1;
  const CurrentFields = STEP_COMPONENTS[currentIndex];

  const advance = async () => {
    const step = PROFILE_STEPS[currentIndex];
    const valid = await form.trigger(step.fields);
    if (!valid) return;
    const next = Math.min(currentIndex + 1, PROFILE_STEPS.length - 1);
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
    if (!isLastStep) {
      void advance();
    }
  };

  const footer = (
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
          Step {currentIndex + 1} of {PROFILE_STEPS.length}
        </span>
        {isLastStep ? (
          <Button.Root
            type="button"
            isDisabled={isPending}
            onPress={() => void form.handleSubmit(handleSave)()}
            className="rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            {isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <SparklesIcon className="size-4" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            {mode === "create" ? "Create profile" : "Save changes"}
          </Button.Root>
        ) : (
          <Button.Root
            type="button"
            isDisabled={isPending}
            onPress={advance}
            className="rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Next
            <ChevronRightIcon className="size-4" />
          </Button.Root>
        )}
      </div>
    </div>
  );

  const content = (
    <div className="space-y-4">
      <ProfileStepper
        currentIndex={currentIndex}
        maxVisitedIndex={maxVisited}
        onStepClick={goTo}
      />
      {accountInfo ? <AccountInfoStrip {...accountInfo} /> : null}
      <CurrentFields />
    </div>
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={onSubmit}
        onKeyDown={handleKeyDown}
        noValidate
        className={
          variant === "modal" ? "flex min-h-0 flex-1 flex-col" : "space-y-6"
        }
      >
        {variant === "modal" ? (
          <>
            <Modal.Body>
              <div className="min-w-0">{content}</div>
            </Modal.Body>
            <Modal.Footer>
              <div className="flex w-full items-center justify-between gap-3 border-t border-zinc-200 pt-4">
                {footer}
              </div>
            </Modal.Footer>
          </>
        ) : (
          <>
            <div className="min-w-0">{content}</div>
            <div className="border-t border-zinc-200 pt-4">
              {footer}
            </div>
          </>
        )}
      </form>
    </FormProvider>
  );
}
