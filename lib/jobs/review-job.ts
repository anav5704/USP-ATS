import type { PrismaClient } from "@/generated/prisma/client";
import { approvalInputSchema, isOwnApprovalRequest, type ApprovalInput } from "@/lib/jobs/approval-schema";
import { jobInputSchema } from "@/lib/jobs/job-schema";
import { todayInFiji, toFijiDate } from "@/lib/jobs/job-dates";

export class ReviewError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

// The caller supplies the authenticated admin ID, never a client-provided ID.
export async function reviewJob(
  jobs: Pick<PrismaClient["jobPosting"], "findUnique" | "updateMany">,
  id: string,
  adminId: string,
  input: ApprovalInput,
) {
  const decision = approvalInputSchema.parse(input);
  const posting = await jobs.findUnique({ where: { id } });
  if (!posting) throw new ReviewError(404, "Job posting not found");
  if (posting.status !== "PENDING_APPROVAL" || posting.revision !== decision.revision) {
    throw new ReviewError(409, "This request changed or was already reviewed. Refresh and review it again.");
  }
  const ownRequest = isOwnApprovalRequest(posting, adminId);
  if (decision.decision === "withdraw" ? !ownRequest : ownRequest) {
    throw new ReviewError(403, decision.decision === "withdraw"
      ? "You can only withdraw your own pending request."
      : "You cannot approve or reject your own approval request.");
  }
  if (decision.decision === "approve") {
    const validation = jobInputSchema.safeParse({
      ...posting,
      gpaMin: posting.gpaMin === null ? null : Number(posting.gpaMin),
      hourlyPay: Number(posting.hourlyPay),
      benefit: posting.benefit ?? "",
      deadline: toFijiDate(posting.deadline),
    });
    if (!validation.success) {
      throw new ReviewError(400, `Correct this posting before approval: ${validation.error.issues[0]?.message}`);
    }
    if (validation.data.deadline < todayInFiji()) {
      throw new ReviewError(400, "An expired posting cannot be approved. Update its deadline first.");
    }
  }

  const result = await jobs.updateMany({
    where: {
      id,
      status: "PENDING_APPROVAL",
      revision: decision.revision,
      ...(decision.decision !== "withdraw" ? {
        createdById: { not: adminId },
        OR: [{ requestedById: null }, { requestedById: { not: adminId } }],
      } : { OR: [{ createdById: adminId }, { requestedById: adminId }] }),
    },
    data: {
      revision: { increment: 1 },
      ...(decision.decision === "withdraw" ? { status: "ARCHIVED" } : decision.decision === "approve" ? {
        status: "ACTIVE",
        approvedById: adminId,
        approvedAt: new Date(),
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
      } : {
        status: "REJECTED",
        rejectedById: adminId,
        rejectedAt: new Date(),
        rejectionReason: decision.rejectionReason || null,
        approvedById: null,
        approvedAt: null,
      }),
    },
  });
  if (result.count !== 1) {
    throw new ReviewError(409, "This request changed during review. Refresh and review it again.");
  }
}
