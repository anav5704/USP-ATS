import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { todayInFiji } from "@/lib/jobs/job-dates";
import {
  unarchiveJobInputSchema,
  type UnarchiveJobInput,
} from "@/lib/jobs/job-schema";
import {
  toJobSnapshot,
  toJsonSnapshot,
  toUnarchiveJsonSnapshot,
} from "@/lib/jobs/job-snapshot";

export class UnarchiveJobError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type UnarchivePosting = {
  id: string;
  status: string;
  deadline: Date;
  revision: number;
  pendingModificationId: string | null;
  approvedAt: Date | null;
  requestedById: string | null;
  rejectedAt: Date | null;
  title: string;
  description: string;
  department: string;
  jobType: string;
  campus: string[];
  gpaMin: { toString(): string } | number | null;
  degree: string[];
  skills: string[];
  hours: number | null;
  hourlyPay: { toString(): string } | number;
  benefit: string | null;
};

export type UnarchiveOutcome =
  | { outcome: "active" }
  | { outcome: "pending_approval"; requestId: string };

type ApprovalState = Pick<
  UnarchivePosting,
  "status" | "approvedAt" | "requestedById" | "rejectedAt"
>;

function isApprovedPosting(posting: ApprovalState) {
  return (
    posting.status === "ACTIVE" ||
    (posting.status === "ARCHIVED" &&
      (posting.approvedAt !== null ||
        (posting.requestedById === null && posting.rejectedAt === null)))
  );
}

export function validateReplacementDeadline(
  input: UnarchiveJobInput | undefined,
  today: string = todayInFiji()
): UnarchiveJobInput {
  const parsed = unarchiveJobInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new UnarchiveJobError(
      400,
      parsed.error.issues[0]?.message ?? "A new application deadline is required."
    );
  }
  if (parsed.data.deadline <= today) {
    throw new UnarchiveJobError(
      400,
      "New application deadline must be a future date."
    );
  }
  return parsed.data;
}

export function unarchiveActionFor(
  posting: Pick<
    UnarchivePosting,
    "status" | "deadline" | "pendingModificationId" | "approvedAt" | "requestedById" | "rejectedAt"
  >,
  input: UnarchiveJobInput | undefined,
  now: Date = new Date()
): "activate" | UnarchiveJobInput {
  if (!isApprovedPosting(posting)) {
    throw new UnarchiveJobError(409, "Only archived approved postings can be unarchived.");
  }
  if (posting.pendingModificationId) {
    throw new UnarchiveJobError(
      409,
      "This posting already has an approval request pending."
    );
  }
  if (posting.status === "ARCHIVED" && posting.deadline.getTime() >= now.getTime()) {
    return "activate";
  }
  if (posting.deadline.getTime() >= now.getTime()) {
    throw new UnarchiveJobError(409, "This posting is already active.");
  }
  return validateReplacementDeadline(input);
}

async function unarchiveInTransaction(
  client: PrismaClient,
  jobId: string,
  adminId: string,
  input: UnarchiveJobInput | undefined,
  now: Date
): Promise<UnarchiveOutcome> {
  return client.$transaction(
    async (transaction) => {
      const posting = await transaction.jobPosting.findUnique({
        where: { id: jobId },
      });
      if (!posting) throw new UnarchiveJobError(404, "Job posting not found");

      const action = unarchiveActionFor(posting, input, now);
      if (action === "activate") {
        const activated = await transaction.jobPosting.updateMany({
          where: {
            id: jobId,
            status: "ARCHIVED",
            revision: posting.revision,
            pendingModificationId: null,
            deadline: { gte: now },
          },
          data: { status: "ACTIVE", revision: { increment: 1 } },
        });
        if (activated.count !== 1) {
          throw new UnarchiveJobError(
            409,
            "This posting changed. Refresh and try again."
          );
        }
        return { outcome: "active" };
      }

      const previous = toJobSnapshot(posting);
      const request = await transaction.jobModificationRequest.create({
        data: {
          jobId,
          requestedById: adminId,
          jobRevision: posting.revision,
          previousData: toJsonSnapshot(previous),
          proposedData: toUnarchiveJsonSnapshot({
            ...previous,
            deadline: action.deadline,
          }),
        },
        select: { id: true },
      });
      const linked = await transaction.jobPosting.updateMany({
        where: {
          id: jobId,
          revision: posting.revision,
          pendingModificationId: null,
          deadline: { lt: now },
          status: { in: ["ACTIVE", "ARCHIVED"] },
        },
        data: {
          status: "ARCHIVED",
          pendingModificationId: request.id,
        },
      });
      if (linked.count !== 1) {
        throw new UnarchiveJobError(
          409,
          "This posting changed or already has an approval request pending."
        );
      }
      return { outcome: "pending_approval", requestId: request.id };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function unarchiveJobPosting(
  client: PrismaClient,
  jobId: string,
  adminId: string,
  input: UnarchiveJobInput | undefined,
  now: Date = new Date()
): Promise<UnarchiveOutcome> {
  try {
    return await unarchiveInTransaction(client, jobId, adminId, input, now);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return unarchiveInTransaction(client, jobId, adminId, input, now);
    }
    throw error;
  }
}
