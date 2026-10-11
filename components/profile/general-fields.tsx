"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input, TextArea } from "@heroui/react";
import { UserRoundIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { SkillAutocomplete } from "@/components/ui/skill-autocomplete";
import { SKILL_GROUPS } from "@/lib/profile/skill-groups";
import { JobSingleAutocomplete } from "@/components/jobs/job-single-autocomplete";
import { USP_CAMPUSES_CENTRES } from "@/lib/jobs/job-constants";
import { splitName } from "@/lib/user-name";

export type GeneralUser = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export function GeneralFields({
  user,
}: {
  user?: GeneralUser | null;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileInput>();

  const { first, last } = user?.firstName
    ? { first: user.firstName, last: user.lastName ?? "" }
    : splitName(user?.name);
  const email = user?.email ?? "";

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-foreground">
          <UserRoundIcon className="size-5" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">
          General details
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="First name">
          <Input.Root disabled fullWidth value={first} />
        </FormField>
        <FormField label="Last name">
          <Input.Root disabled fullWidth value={last} />
        </FormField>
      </div>
      <div className="mt-4">
        <FormField label="Email">
          <Input.Root disabled fullWidth value={email} />
        </FormField>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField
          id="phone"
          label="Phone number (optional)"
          error={errors.phone?.message}
        >
          <Input.Root
            id="phone"
            type="tel"
            fullWidth
            placeholder="e.g. +679 323 1000"
            {...register("phone")}
          />
        </FormField>
        <FormField
          label="Campus/Centre"
          error={errors.campuses?.message}
        >
          <Controller
            name="campuses"
            control={control}
            render={({ field }) => (
              <JobSingleAutocomplete
                value={field.value[0] ?? ""}
                options={USP_CAMPUSES_CENTRES}
                placeholder="Select your campus or centre"
                searchPlaceholder="Search campuses and centres"
                onChange={(campus) =>
                  field.onChange(campus ? [campus] : [])
                }
              />
            )}
          />
        </FormField>
      </div>
      <div className="mt-4">
        <FormField
          id="bio"
          label="Bio (optional)"
          error={errors.bio?.message}
        >
          <TextArea.Root
            id="bio"
            rows={3}
            maxLength={500}
            fullWidth
            placeholder="Tell employers a little about who you are"
            {...register("bio")}
          />
        </FormField>
      </div>
      <div className="mt-4">
        <FormField
          label="Skills"
          error={errors.skills?.message}
        >
          <Controller
            name="skills"
            control={control}
            render={({ field }) => (
              <SkillAutocomplete
                value={field.value}
                groups={SKILL_GROUPS}
                placeholder="Select up to 10 skills"
                searchPlaceholder="Search skills"
                emptyMessage="No skills found"
                maxItems={10}
                limitMessage="You can select up to 10 skills"
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
      </div>
    </section>
  );
}
