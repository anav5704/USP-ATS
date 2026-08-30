"use client";

import { useFormContext } from "react-hook-form";
import { CheckIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import {
  PROFILE_SECTIONS,
  isSectionComplete,
} from "@/components/profile/profile-sections";

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

  const completedRequired = PROFILE_SECTIONS.filter(
    (s) => !s.optional && complete[PROFILE_SECTIONS.indexOf(s)]
  ).length;
  const requiredCount = PROFILE_SECTIONS.filter((s) => !s.optional).length;
  const percent = Math.round((completedRequired / requiredCount) * 100);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">
          Profile progress
        </h2>
        <span className="text-sm font-medium tabular-nums text-muted">
          {percent}%
        </span>
      </div>

      <ol className="flex items-start gap-0">
        {PROFILE_SECTIONS.map((section, index) => {
          const isComplete = complete[index];
          const isChecked = isComplete && index <= currentIndex;
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
                    connectorDone ? "bg-primary-bright" : "bg-border"
                  }`}
                  style={{ left: "-50%", top: "15px" }}
                />
              ) : null}

              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${section.label}${
                    isChecked ? " (complete)" : ""
                  }`}
                  onClick={() => isClickable && onStepClick?.(index)}
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2 disabled:cursor-default ${
                    isChecked
                      ? "border-transparent bg-primary-gradient text-background"
                      : isCurrent
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-surface-secondary text-muted"
                  }`}
                >
                  {isChecked ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <span
                  className={`max-w-full truncate px-0.5 text-center text-[11px] font-medium ${
                    isCurrent ? "text-foreground" : "text-muted"
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
