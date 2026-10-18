"use client";

import Link from "next/link";
import { Skeleton, Table } from "@heroui/react";
import { ArrowLeftIcon } from "lucide-react";

const SKELETON_ROWS = [
  { id: "row-1" },
  { id: "row-2" },
  { id: "row-3" },
];

export function AdminApplicantsSkeleton() {
  return (
    <div className="flex h-full flex-col p-2 sm:p-3" role="status" aria-label="Loading applicants">
      <span className="sr-only">Loading applicants</span>
      <div className="mx-auto flex min-h-0 w-full max-w-none flex-1 flex-col gap-3">
        <div className="shrink-0 rounded-2xl border border-border bg-surface p-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-field text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Return to Job Postings
          </Link>
          <div className="mt-4">
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              Applicants
            </h1>
            <Skeleton.Root className="mt-3 h-6 w-48 rounded-lg" />
            <Skeleton.Root className="mt-2 h-4 w-64 max-w-full rounded-lg" />
          </div>
        </div>

        <Table.Root className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-surface">
          <Table.ScrollContainer className="min-h-0 flex-1 overflow-auto">
            <Table.Content aria-label="Loading applicants table" className="min-w-[52rem]">
              <Table.Header>
                <Table.Column isRowHeader>Applicant</Table.Column>
                <Table.Column>Campus/Centre</Table.Column>
                <Table.Column>Applied On</Table.Column>
                <Table.Column>AI Score</Table.Column>
                <Table.Column>Status</Table.Column>
              </Table.Header>
              <Table.Body items={SKELETON_ROWS}>
                {(row) => (
                  <Table.Row id={row.id}>
                    <Table.Cell>
                      <Skeleton.Root className="h-4 w-36 rounded-lg" />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton.Root className="h-4 w-32 rounded-lg" />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton.Root className="h-4 w-24 rounded-lg" />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton.Root className="h-6 w-16 rounded-full" />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton.Root className="h-8 w-28 rounded-field" />
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table.Root>
      </div>
    </div>
  );
}
