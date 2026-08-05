"use client";

import { useFormContext } from "react-hook-form";
import { CheckIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { PROFILE_STEPS, isStepComplete } from "@/components/profile/profile-steps";

export function ProfileStepper({
  currentIndex,
  maxVisitedIndex,
  onStepClick,
}: {
  currentIndex: number;
  maxVisitedIndex: number;
  onStepClick?: (index: number) => void;
}) {
  const { watch, formState } = useFormContext<ProfileInput>();
  const values = watch();

  const complete = PROFILE_STEPS.map((step) =>
    isStepComplete(step, values, formState.errors)
  );

  const requiredSteps = PROFILE_STEPS.filter((step) => !step.optional);
  const completedRequired = PROFILE_STEPS.filter(
    (step) => !step.optional && complete[PROFILE_STEPS.indexOf(step)]
  ).length;
  const percent = Math.round((completedRequired / requiredSteps.length) * 100);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Profile progress
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Complete each step to finish your profile.
          </p>
        </div>
        <span className="text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
          {percent}%
        </span>
      </div>

      <ol className="flex items-start gap-0">
        {PROFILE_STEPS.map((step, index) => {
          const isComplete = complete[index];
          const isCurrent = index === currentIndex;
          const isVisited = index <= maxVisitedIndex;
          const isClickable = isVisited && !!onStepClick;
          const connectorDone = index <= currentIndex;

          return (
            <li key={step.id} className="relative min-w-0 flex-1">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={`absolute h-0.5 w-full ${
                    connectorDone
                      ? "bg-emerald-400 dark:bg-emerald-500"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                  style={{ left: "-50%", top: "15px" }}
                />
              ) : null}

              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${step.label}${isComplete ? " (complete)" : ""}`}
                  onClick={() => isClickable && onStepClick?.(index)}
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-default ${
                    isComplete
                      ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-500 dark:bg-emerald-500"
                      : isCurrent
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                >
                  {isComplete ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <span
                  className={`max-w-full truncate px-0.5 text-center text-[11px] font-medium ${
                    isCurrent
                      ? "text-zinc-900 dark:text-zinc-50"
                      : isComplete
                        ? "text-zinc-600 dark:text-zinc-300"
                        : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {step.shortLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
