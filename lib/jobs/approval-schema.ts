import { z } from "zod";

export const approvalInputSchema = z.object({
  decision: z.enum(["approve", "reject", "withdraw"]),
  revision: z.number().int().nonnegative(),
  rejectionReason: z.string().trim().max(500, "Rejection reason must be at most 500 characters.").optional(),
}).strict();

export type ApprovalInput = z.infer<typeof approvalInputSchema>;

export function isOwnApprovalRequest(
  posting: {
    createdById: string;
    requestedById: string | null;
    requestType?: "NEW_JOB" | "MODIFICATION";
  },
  adminId: string,
) {
  if (posting.requestType === "MODIFICATION") {
    return posting.requestedById === adminId;
  }
  return posting.createdById === adminId || posting.requestedById === adminId;
}

export const pendingReviewData = (adminId: string) => ({
  status: "PENDING_APPROVAL" as const,
  requestedById: adminId,
  requestedAt: new Date(),
  approvedById: null,
  approvedAt: null,
  rejectedById: null,
  rejectedAt: null,
  rejectionReason: null,
});
