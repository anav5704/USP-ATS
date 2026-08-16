"use client";

import { useFormContext } from "react-hook-form";
import { CheckIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { PROFILE_SECTIONS, isSectionComplete } from "@/components/profile/profile-sections";

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

  const complete = PROFILE_SECTIONS.map((section) =>
    isSectionComplete(section, values, formState.errors)
  );

  const requiredSections = PROFILE_SECTIONS.filter((section) => !section.optional);
  const completedRequired = PROFILE_SECTIONS.filter(
    (section) =>
      !section.optional &&
      complete[PROFILE_SECTIONS.indexOf(section)]
  ).length;
  const percent = Math.round(
    (completedRequired / requiredSections.length) * 100
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Profile progress
        </h2>
        <span className="text-sm font-medium tabular-nums text-zinc-700">
          {percent}%
        </span>
      </div>

      <ol className="flex items-start gap-0">
        {PROFILE_SECTIONS.map((section, index) => {
          const isComplete = complete[index];
          const isCurrent = index === currentIndex;
          const isVisited = index <= maxVisitedIndex;
          const isClickable = isVisited && !!onStepClick;
          const connectorDone = index <= currentIndex;

          return (
            <li key={section.id} className="relative min-w-0 flex-1">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={`absolute h-0.5 w-full ${
                    connectorDone
                      ? "bg-emerald-400"
                      : "bg-zinc-200"
                  }`}
                  style={{ left: "-50%", top: "15px" }}
                />
              ) : null}

              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${section.label}${isComplete ? " (complete)" : ""}`}
                  onClick={() => isClickable && onStepClick?.(index)}
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-default ${
                    isComplete
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-zinc-100 text-zinc-400"
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
                      ? "text-zinc-900"
                      : isComplete
                        ? "text-zinc-600"
                        : "text-zinc-400"
                  }`}
                >
                  {section.shortLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
