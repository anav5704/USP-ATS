"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Spinner, Table } from "@heroui/react";
import {
  BriefcaseBusinessIcon,
  ArchiveIcon,
  CircleAlertIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useAdminJobs } from "@/components/jobs/use-admin-jobs";
import { useRemoveJob } from "@/components/jobs/use-remove-job";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";

const dateFormatter = new Intl.DateTimeFormat("en-FJ", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function AdminJobList() {
  const { data: jobs, isPending, isError, refetch } = useAdminJobs();
  const { isPending: isRemoving, removeAsync } = useRemoveJob();
  const [selectedJob, setSelectedJob] = useState<AdminJobListItem | null>(null);

  const confirmRemoval = async () => {
    if (!selectedJob) return;
    const result = await removeAsync(selectedJob.id);
    if (result.success) setSelectedJob(null);
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Job postings
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              View and manage job opportunities available through USP.
            </p>
          </div>
          <Link href="/admin/jobs/new">
            <Button.Root className="rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700">
              <PlusIcon className="size-4" />
              Post new job
            </Button.Root>
          </Link>
        </div>

        {isPending ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <Spinner.Root size="lg" />
          </div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <CircleAlertIcon className="size-10 text-rose-500" />
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              Job postings could not be loaded
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try again
            </Button.Root>
          </div>
        ) : jobs?.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <BriefcaseBusinessIcon className="size-10 text-zinc-400" />
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              No job postings yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Create the first posting to make it immediately available to students.
            </p>
          </div>
        ) : (
          <Table.Root className="rounded-2xl border border-zinc-200 bg-white">
            <Table.ScrollContainer>
              <Table.Content aria-label="Job postings">
                <Table.Header>
                  <Table.Column isRowHeader>Job</Table.Column>
                  <Table.Column>Type</Table.Column>
                  <Table.Column>Campus</Table.Column>
                  <Table.Column>Deadline</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Applications</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body items={jobs}>
                  {(job) => (
                    <Table.Row id={job.id}>
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-zinc-900">{job.title}</p>
                          <p className="text-xs text-zinc-500">{job.department}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{job.jobType}</Table.Cell>
                      <Table.Cell>{job.campus.join(", ")}</Table.Cell>
                      <Table.Cell>
                        {dateFormatter.format(new Date(job.deadline))}
                      </Table.Cell>
                      <Table.Cell>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            job.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {job.status === "ACTIVE" ? "Active" : "Archived"}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{job.applicationCount}</Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/jobs/${job.id}/edit`}>
                            <Button.Root
                              size="sm"
                              variant="ghost"
                              aria-label={`Edit ${job.title}`}
                              className="text-zinc-600"
                            >
                              <PencilIcon className="size-4" />
                              Edit
                            </Button.Root>
                          </Link>
                          {job.status === "ACTIVE" ? (
                            <Button.Root
                              size="sm"
                              variant="ghost"
                              aria-label={`Remove ${job.title}`}
                              onPress={() => setSelectedJob(job)}
                              className="text-rose-600 hover:bg-rose-50"
                            >
                              {job.applicationCount === 0 ? (
                                <Trash2Icon className="size-4" />
                              ) : (
                                <ArchiveIcon className="size-4" />
                              )}
                              {job.applicationCount === 0 ? "Delete" : "Archive"}
                            </Button.Root>
                          ) : null}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table.Root>
        )}
      </div>
      <ConfirmModal
        isOpen={selectedJob !== null}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setSelectedJob(null);
        }}
        title={
          selectedJob?.applicationCount === 0
            ? "Delete job posting?"
            : "Archive job posting?"
        }
        message={
          selectedJob?.applicationCount === 0
            ? "This posting currently has no applications and will be permanently deleted. The server will verify this again before deleting."
            : "This posting has applications and will be archived. All applications and AI scores will be preserved."
        }
        confirmLabel={
          selectedJob?.applicationCount === 0
            ? "Delete posting"
            : "Archive posting"
        }
        icon={selectedJob?.applicationCount === 0 ? Trash2Icon : ArchiveIcon}
        danger={selectedJob?.applicationCount === 0}
        isPending={isRemoving}
        onConfirm={confirmRemoval}
      />
    </div>
  );
}
