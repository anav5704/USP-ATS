"use client";

import { useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { CircleAlertIcon, ClipboardListIcon } from "lucide-react";
import { useMyApplications } from "@/components/applications/use-my-applications";
import { ApplicationCard } from "@/components/applications/application-card";
import { ApplicationDetailModal } from "@/components/applications/application-detail-modal";
import type { ApplicationListItem } from "@/lib/applications/application-schema";

export function MyApplications() {
  const { data: applications, isPending, isError, refetch } = useMyApplications();
  const [selected, setSelected] = useState<ApplicationListItem | null>(null);

  const selectedApplication = selected
    ? (applications ?? []).find(
        (application) => application.id === selected.id
      ) ?? selected
    : null;

  return (
    <div className="p-3">
      <div className="mx-auto max-w-none">
        <div className="sticky top-3 z-10 mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
          <ClipboardListIcon className="size-5" />
          <h1 className="text-xl font-semibold text-foreground">My Applications</h1>
        </div>

        {isPending ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface">
            <Spinner.Root size="lg" className="text-foreground" />
          </div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <CircleAlertIcon className="size-10 text-danger" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              Applications could not be loaded
            </h2>
            <p className="mt-1 text-sm text-muted">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try Again
            </Button.Root>
          </div>
        ) : applications && applications.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <ClipboardListIcon className="size-10 text-muted" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              No applications yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Apply to jobs from the Job Feed and they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(applications ?? []).map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onPress={() => setSelected(application)}
              />
            ))}
          </div>
        )}
      </div>
      {selectedApplication ? (
        <ApplicationDetailModal
          application={selectedApplication}
          isOpen
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}