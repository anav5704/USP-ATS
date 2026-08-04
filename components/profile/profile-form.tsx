"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button, Input, TextArea } from "@heroui/react";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  LoaderCircleIcon,
  SaveIcon,
  SparklesIcon,
} from "lucide-react";
import { createProfile, updateProfile } from "@/lib/profile/actions";
import {
  profileInputSchema,
  type ProfileInput,
} from "@/lib/profile/profile-schema";
import { DegreeFields } from "@/components/profile/degree-fields";
import { EducationFields } from "@/components/profile/education-fields";
import { FormField } from "@/components/profile/form-field";
import { ProjectFields } from "@/components/profile/project-fields";

const EMPTY_PROFILE = {
  gpa: undefined as unknown as number,
  skills: "",
  degrees: [{ name: "", institution: "" }],
  education: [{ institution: "", program: "" }],
  projects: [],
};

export function ProfileForm({
  mode,
  initialData,
  onSuccess,
}: {
  mode: "create" | "update";
  initialData?: ProfileInput;
  onSuccess?: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: initialData ?? EMPTY_PROFILE,
  });

  const mutation = useMutation({
    mutationFn: async (values: ProfileInput) =>
      mode === "create" ? createProfile(values) : updateProfile(values),
    onSuccess: (result) => {
      if (result.success) {
        setServerError(null);
        if (mode === "create") {
          router.replace("/");
          return;
        }
        setSaved(true);
        window.setTimeout(() => setSaved(false), 3000);
        onSuccess?.();
      } else {
        setSaved(false);
        setServerError(result.error);
      }
    },
    onError: () => {
      setSaved(false);
      setServerError("Something went wrong. Please try again.");
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    setSaved(false);
    await mutation.mutateAsync(values);
  });

  const gpaError = form.formState.errors.gpa?.message;
  const skillsError = form.formState.errors.skills?.message;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {serverError ? (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          >
            <CircleAlertIcon className="size-4 shrink-0" />
            {serverError}
          </div>
        ) : null}

        {saved && mode === "update" ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
          >
            <CheckCircle2Icon className="size-4 shrink-0" />
            Profile updated successfully.
          </div>
        ) : null}

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
              <BookOpenIcon className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Academic details
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Your average GPA is measured out of 4.5.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="gpa"
              label="Average GPA (out of 4.5)"
              error={gpaError}
            >
              <Input.Root
                id="gpa"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                max={4.5}
                placeholder="e.g. 3.8"
                fullWidth
                {...form.register("gpa", {
                  setValueAs: (value) =>
                    value === "" ? undefined : Number(value),
                })}
              />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField
              id="skills"
              label="Technical skills"
              error={skillsError}
              hint="List the technologies, tools and other skills you have."
            >
              <TextArea.Root
                id="skills"
                rows={3}
                fullWidth
                placeholder="e.g. Python, JavaScript, Excel, Public speaking"
                {...form.register("skills")}
              />
            </FormField>
          </div>
        </section>

        <DegreeFields />
        <EducationFields />
        <ProjectFields />

        <div className="flex justify-end">
          <Button.Root
            type="submit"
            size="lg"
            isDisabled={mutation.isPending}
            className="rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {mutation.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <SparklesIcon className="size-4" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            {mode === "create" ? "Create profile" : "Save changes"}
          </Button.Root>
        </div>
      </form>
    </FormProvider>
  );
}
