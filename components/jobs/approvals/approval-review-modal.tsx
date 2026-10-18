"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, TextArea } from "@heroui/react";
import { CheckIcon, CircleAlertIcon, XIcon } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { FormField } from "@/components/ui/form-field";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import { ApprovalDetails } from "@/components/jobs/approvals/approval-details";
import { useReviewJob } from "@/components/jobs/approvals/use-approvals";
import { approvalInputSchema, isOwnApprovalRequest, type ApprovalInput } from "@/lib/jobs/approval-schema";
import type { ApprovalJob } from "@/lib/jobs/job-schema";
import { useSessionContext } from "@/lib/use-auth";

const reasonSchema = approvalInputSchema.pick({ rejectionReason: true });

export function ApprovalReviewModal({ job, onClose, withdraw = false }: { job: ApprovalJob; onClose: () => void; withdraw?: boolean }) {
  const session = useSessionContext();
  const review = useReviewJob(job);
  const [decision, setDecision] = useState<ApprovalInput["decision"] | null>(withdraw ? "withdraw" : null);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<{ rejectionReason?: string }>({
    resolver: zodResolver(reasonSchema),
    mode: "onChange",
    defaultValues: { rejectionReason: "" },
  });
  const ownRequest = isOwnApprovalRequest(job, session?.user.id ?? "");
  const canReview = !!session && !ownRequest && job.approvalStatus === "Pending Approval";
  const canWithdraw = !!session && ownRequest && job.approvalStatus === "Pending Approval";
  const confirm = async () => {
    if (!decision) return;
    try {
      await review.mutateAsync({
        decision, revision: job.revision,
        rejectionReason: decision === "reject" ? getValues("rejectionReason") : undefined,
      });
      onClose();
    } catch {
      setDecision(null);
    }
  };
  return <>
    <FormModal isOpen onOpenChange={(open) => { if (!open && !review.isPending) onClose(); }}
      title={job.requestType === "UNARCHIVE" ? "Review unarchive request" : job.requestType === "MODIFICATION" ? "Review job modification" : "Review job posting"}
      info={{
        title: "Second-admin rule",
        body: "The admin who requested this cannot act on it. Approving makes the request effective; rejecting keeps the posting hidden or unchanged.",
      }}
      closeDisabled={review.isPending}>
      <form className="mt-5 flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(() => { if (canReview) setDecision("reject"); })}>
        <Modal.Body>
          <ApprovalDetails job={job} />
          {ownRequest ? <p className="my-4 flex items-center gap-2 text-sm text-muted">
            <CircleAlertIcon className="size-4 shrink-0" />You cannot approve or reject your own approval request.
          </p> : null}
          {review.error ? <p role="alert" className="my-4 flex items-center gap-2 text-sm text-danger">
            <CircleAlertIcon className="size-4 shrink-0" />{review.error.message}
          </p> : null}
          {canReview ? <FormField id="rejectionReason" label="Rejection reason (optional)" error={errors.rejectionReason?.message}>
            <TextArea.Root id="rejectionReason" fullWidth rows={3} {...register("rejectionReason")} />
          </FormField> : null}
        </Modal.Body>
        <Modal.Footer>
          <Button.Root variant="ghost" isDisabled={review.isPending} onPress={onClose}>Close</Button.Root>
          {canWithdraw ? <IconTooltip label="Withdrawing cancels your request and archives the posting">
            <Button.Root isDisabled={review.isPending} onPress={() => setDecision("withdraw")}
              className="rounded-field bg-danger px-5 text-sm font-medium text-danger-foreground hover:bg-danger-hover">
              Withdraw Request
            </Button.Root>
          </IconTooltip> : null}
          {canReview ? (<>
          <IconTooltip label="Approving applies the request and makes the posting active">
            <Button.Root isDisabled={!session || ownRequest || review.isPending}
              onPress={() => setDecision("approve")}
              className="rounded-field bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">
              <CheckIcon className="size-4" />Approve
            </Button.Root>
          </IconTooltip>
          <IconTooltip label="Rejecting hides the posting; a reason is optional">
            <Button.Root type="submit" isDisabled={review.isPending}
              className="rounded-field bg-danger px-5 text-sm font-medium text-danger-foreground hover:bg-danger-hover">
              <XIcon className="size-4" />Reject
            </Button.Root>
          </IconTooltip>
          </>) : null}
        </Modal.Footer>
      </form>
    </FormModal>
    <ConfirmModal isOpen={decision !== null} onOpenChange={(open) => { if (!open && !review.isPending) setDecision(null); }}
      title={decision === "withdraw" ? "Withdraw approval request?" : decision === "approve" ? job.requestType === "UNARCHIVE" ? "Approve unarchive request?" : `Approve job ${job.requestType === "MODIFICATION" ? "modification" : "posting"}?` : job.requestType === "UNARCHIVE" ? "Reject unarchive request?" : `Reject job ${job.requestType === "MODIFICATION" ? "modification" : "posting"}?`}
      message={decision === "withdraw"
        ? job.requestType === "UNARCHIVE"
          ? "This unarchive request will be cancelled. The posting will remain archived with its existing deadline."
          : job.requestType === "MODIFICATION"
          ? "This modification request will be cancelled. The approved posting will remain unchanged."
          : "This pending request will be cancelled and archived, preserving its data."
        : decision === "approve"
          ? job.requestType === "UNARCHIVE"
            ? "The new deadline will be applied and the existing posting will become active."
            : job.requestType === "MODIFICATION"
            ? "The proposed values will be applied to the existing posting without changing its job ID or applications."
            : "This posting will become active and visible to applicants."
          : job.requestType === "UNARCHIVE"
            ? "The posting will remain archived and its existing deadline will be preserved."
            : job.requestType === "MODIFICATION"
            ? "The proposed values will be discarded and the approved posting will remain unchanged."
            : "This posting will be rejected and remain hidden from applicants."}
      confirmLabel={decision === "withdraw" ? "Withdraw Request" : decision === "approve" ? "Approve" : "Reject"}
      icon={decision === "approve" ? CheckIcon : XIcon} danger={decision !== "approve"}
      isPending={review.isPending} onConfirm={confirm} />
  </>;
}
