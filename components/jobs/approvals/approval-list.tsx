"use client";

import { useState } from "react";
import { Button, Spinner, Table } from "@heroui/react";
import { CircleAlertIcon, ClipboardCheckIcon, EyeIcon } from "lucide-react";
import { useApprovals } from "@/components/jobs/approvals/use-approvals";
import { ApprovalReviewModal } from "@/components/jobs/approvals/approval-review-modal";
import type { ApprovalJob } from "@/lib/jobs/job-schema";
import { JOB_DATE_TIME_ZONE } from "@/lib/jobs/job-dates";
import { useAuth } from "@/lib/use-auth";
import { isOwnApprovalRequest } from "@/lib/jobs/approval-schema";
import { ApprovalStatusBadge } from "@/components/jobs/approvals/approval-status-badge";

export function ApprovalList() {
  const { data: jobs, isPending, isError, refetch } = useApprovals();
  // Keep the reviewed revision stable even when the pending list refetches.
  const [reviewing, setReviewing] = useState<ApprovalJob | null>(null);
  const [withdraw, setWithdraw] = useState(false);
  const { data: session } = useAuth();
  const ownRequest = (job: ApprovalJob) => isOwnApprovalRequest(job, session?.user.id ?? "");
  const sections = [
    { title: "My Requests", mine: true, jobs: (jobs ?? []).filter(ownRequest) },
    { title: "Review Job Requests", mine: false, jobs: (jobs ?? []).filter((job) => job.status === "PENDING_APPROVAL" && !ownRequest(job)) },
  ];
  return <div className="p-3">
    <div className="sticky top-3 z-10 mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <ClipboardCheckIcon className="size-5" /><h1 className="text-xl font-semibold text-foreground">Approvals</h1>
    </div>
    {isPending ? <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface">
      <Spinner.Root size="lg" className="text-foreground" />
    </div> : isError ? <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
      <CircleAlertIcon className="size-10 text-danger" />
      <h2 className="mt-4 text-xl font-semibold text-foreground">Approval requests could not be loaded</h2>
      <Button.Root className="mt-5" onPress={() => void refetch()}>Try Again</Button.Root>
    </div> : sections.map((section) => <section key={section.title} className="mb-6">
      <h2 className="mb-3 text-xl font-semibold text-foreground">{section.title}</h2>
      {!section.jobs.length ? <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
      <ClipboardCheckIcon className="size-10 text-muted" />
      <p className="mt-4 text-xl font-semibold text-foreground">{section.mine ? "You have no approval requests" : "No requests awaiting your review"}</p>
    </div> : <Table.Root className="rounded-2xl border border-border bg-surface">
      <Table.ScrollContainer><Table.Content aria-label={section.title}>
        <Table.Header>
          <Table.Column isRowHeader>Job Title</Table.Column><Table.Column>Job Type</Table.Column>
          <Table.Column>Campus/Centre</Table.Column><Table.Column>Hourly Pay</Table.Column>
          <Table.Column>Requested By</Table.Column><Table.Column>Date Requested</Table.Column><Table.Column>Actions</Table.Column>
          <Table.Column>Status / Review</Table.Column>
        </Table.Header>
        <Table.Body>{section.jobs.map((job) => <Table.Row key={job.id} id={job.id}>
          <Table.Cell><p className="font-medium text-foreground">{job.title}</p><p className="text-xs text-muted">{job.department}</p></Table.Cell>
          <Table.Cell>{job.jobType}</Table.Cell><Table.Cell>{job.campus.join(", ")}</Table.Cell>
          <Table.Cell>{new Intl.NumberFormat("en-FJ", { style: "currency", currency: "FJD" }).format(job.hourlyPay)}</Table.Cell>
          <Table.Cell>{(job.requestedBy ?? job.createdBy).name}</Table.Cell>
          <Table.Cell>{new Date(job.requestedAt).toLocaleDateString("en-FJ", { timeZone: JOB_DATE_TIME_ZONE })}</Table.Cell>
          <Table.Cell><Button.Root variant="ghost" onPress={() => { setWithdraw(false); setReviewing(job); }} aria-label={`View ${job.title}`}>
            <EyeIcon className="size-4" />{section.mine ? "View" : "Review"}
          </Button.Root>
          {section.mine && job.status === "PENDING_APPROVAL" ? <Button.Root variant="ghost"
            onPress={() => { setWithdraw(true); setReviewing(job); }}>Withdraw Request</Button.Root> : null}</Table.Cell>
          <Table.Cell><ApprovalStatusBadge job={job} />
            <p className="mt-1 text-xs text-muted">{(job.approvedBy ?? job.rejectedBy)?.name}</p>
            {job.rejectionReason ? <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{job.rejectionReason}</p> : null}
          </Table.Cell>
        </Table.Row>)}</Table.Body>
      </Table.Content></Table.ScrollContainer>
    </Table.Root>}</section>)}
    {reviewing ? <ApprovalReviewModal key={`${reviewing.id}:${reviewing.revision}`} job={reviewing} withdraw={withdraw} onClose={() => setReviewing(null)} /> : null}
  </div>;
}
