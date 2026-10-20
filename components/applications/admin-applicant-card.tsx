"use client";

import type { KeyboardEvent } from "react";
import { Card } from "@heroui/react";
import { CalendarDaysIcon, MapPinIcon, UserRoundIcon } from "lucide-react";
import { ApplicationScoreCell } from "@/components/applications/application-score-cell";
import { ChangeStatusMenu } from "@/components/applications/change-status-menu";
import type {
  AdminApplicantTableItem,
  AdminApplicationStatus,
} from "@/lib/applications/application-schema";

export function AdminApplicantCard({
  application,
  appliedOn,
  isUpdating,
  isRescoring,
  onOpen,
  onPrefetch,
  onRescore,
  onStatusChange,
}: {
  application: AdminApplicantTableItem;
  appliedOn: string;
  isUpdating: boolean;
  isRescoring: boolean;
  onOpen: () => void;
  onPrefetch: () => void;
  onRescore: () => void;
  onStatusChange: (status: AdminApplicationStatus) => void;
}) {
  const stopPropagation = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <Card.Root
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="min-w-0 cursor-pointer rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-muted">
            <UserRoundIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-semibold text-foreground">
              {application.applicant.name}
            </h2>
            <span className="mt-1 flex min-w-0 items-start gap-2 text-sm text-muted">
              <MapPinIcon className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 break-words">
                {application.applicant.campuses.length
                  ? application.applicant.campuses.join(", ")
                  : "Not provided"}
              </span>
            </span>
            <span className="mt-1 flex items-center gap-2 text-sm text-muted">
              <CalendarDaysIcon className="size-4 shrink-0" />
              Applied {appliedOn}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div
            className="min-w-0"
            onPointerDown={stopPropagation}
            onPointerUp={stopPropagation}
            onClick={stopPropagation}
            onKeyDown={stopPropagation}
          >
            <ApplicationScoreCell
              score={application.score}
              onRescore={onRescore}
              isRescoring={isRescoring}
            />
          </div>
          <div
            onPointerDown={stopPropagation}
            onPointerUp={stopPropagation}
            onClick={stopPropagation}
            onKeyDown={stopPropagation}
          >
            <ChangeStatusMenu
              status={application.status}
              isDisabled={isUpdating}
              onSelect={onStatusChange}
            />
          </div>
        </div>
      </div>
    </Card.Root>
  );
}
