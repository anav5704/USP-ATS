import type { PrismaClient } from "@/generated/prisma/client";
import type { ApprovalInput } from "@/lib/jobs/approval-schema";
import { approvalInputSchema } from "@/lib/jobs/approval-schema";
import type { JobInput } from "@/lib/jobs/job-schema";
import {
  isUnarchiveSnapshot,
  jobInputDatabaseData,
  parseJobSnapshot,
  toJobSnapshot,
  toJsonSnapshot,
} from "@/lib/jobs/job-snapshot";
import { todayInFiji } from "@/lib/jobs/job-dates";

export class JobModificationError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function isApprovedPosting(posting: {
  status: string;
  approvedAt: Date | null;
  requestedById: string | null;
  rejectedAt: Date | null;
}) {
  return (
    posting.status === "ACTIVE" ||
    (posting.status === "ARCHIVED" &&
      (posting.approvedAt !== null ||
        (posting.requestedById === null && posting.rejectedAt === null)))
  );
}

export async function requestJobModification(
  client: PrismaClient,
  jobId: string,
  adminId: string,
  proposed: JobInput
) {
  return client.$transaction(async (transaction) => {
    const posting = await transaction.jobPosting.findUnique({
      where: { id: jobId },
    });
    if (!posting) {
      throw new JobModificationError(404, "Job posting not found");
    }
    if (!isApprovedPosting(posting)) {
      throw new JobModificationError(
        409,
        "Only approved job postings can be modified."
      );
    }
    if (posting.pendingModificationId !== null) {
      throw new JobModificationError(
        409,
        "This posting already has a modification awaiting approval."
      );
    }

    const request = await transaction.jobModificationRequest.create({
      data: {
        jobId,
        requestedById: adminId,
        jobRevision: posting.revision,
        previousData: toJsonSnapshot(toJobSnapshot(posting)),
        proposedData: toJsonSnapshot(proposed),
      },
      select: { id: true },
    });

    const linked = await transaction.jobPosting.updateMany({
      where: {
        id: jobId,
        revision: posting.revision,
        pendingModificationId: null,
      },
      data: { pendingModificationId: request.id },
    });
    if (linked.count !== 1) {
      throw new JobModificationError(
        409,
        "This posting changed. Refresh and try again."
      );
    }

    return request;
  });
}

export async function reviewJobModification(
  client: PrismaClient,
  jobId: string,
  requestId: string,
  adminId: string,
  input: ApprovalInput
) {
  const decision = approvalInputSchema.parse(input);

  return client.$transaction(async (transaction) => {
    const request = await transaction.jobModificationRequest.findFirst({
      where: { id: requestId, jobId },
    });
    if (!request) {
      throw new JobModificationError(404, "Modification request not found");
    }
    if (request.status !== "PENDING" || request.revision !== decision.revision) {
      throw new JobModificationError(
        409,
        "This request changed or was already reviewed. Refresh and review it again."
      );
    }

    const ownRequest = request.requestedById === adminId;
    const unarchiveRequest = isUnarchiveSnapshot(request.proposedData);
    if (decision.decision === "withdraw" ? !ownRequest : ownRequest) {
      throw new JobModificationError(
        403,
        decision.decision === "withdraw"
          ? "You can only withdraw your own pending request."
          : "You cannot approve or reject your own modification request."
      );
    }

    let proposed: JobInput | null = null;
    if (decision.decision === "approve") {
      const parsed = parseJobSnapshot(request.proposedData);
      if (!parsed.success) {
        throw new JobModificationError(
          400,
          `Correct this modification before approval: ${parsed.error.issues[0]?.message}`
        );
      }
      proposed = parsed.data;
      if (unarchiveRequest && proposed.deadline <= todayInFiji()) {
        throw new JobModificationError(
          400,
          "The proposed unarchive deadline is no longer a future date."
        );
      }
    }

    const posting = await transaction.jobPosting.updateMany({
      where: {
        id: jobId,
        revision: request.jobRevision,
        pendingModificationId: request.id,
      },
      data:
        decision.decision === "approve" && proposed
          ? {
              ...jobInputDatabaseData(proposed),
              ...(unarchiveRequest ? { status: "ACTIVE" as const } : {}),
              pendingModificationId: null,
              revision: { increment: 1 },
            }
          : { pendingModificationId: null },
    });
    if (posting.count !== 1) {
      throw new JobModificationError(
        409,
        "This posting changed during review. Refresh and review it again."
      );
    }

    const reviewed = await transaction.jobModificationRequest.updateMany({
      where: {
        id: request.id,
        status: "PENDING",
        revision: decision.revision,
        ...(decision.decision === "withdraw"
          ? { requestedById: adminId }
          : { requestedById: { not: adminId } }),
      },
      data: {
        revision: { increment: 1 },
        status:
          decision.decision === "approve"
            ? "APPROVED"
            : decision.decision === "reject"
              ? "REJECTED"
              : "WITHDRAWN",
        reviewedById:
          decision.decision === "withdraw" ? null : adminId,
        reviewedAt: new Date(),
        rejectionReason:
          decision.decision === "reject"
            ? decision.rejectionReason || null
            : null,
      },
    });
    if (reviewed.count !== 1) {
      throw new JobModificationError(
        409,
        "This request changed during review. Refresh and review it again."
      );
    }
  });
}
