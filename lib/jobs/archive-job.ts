import { prisma } from "@/lib/prisma";
import { PostingStatus, Prisma } from "@/generated/prisma/client";

export class ArchiveJobError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type ArchivePosting = {
  id: string;
  pendingModificationId: string | null;
};

export async function archiveJobRecord(
  findPosting: (id: string) => Promise<ArchivePosting | null>,
  updateStatus: (id: string, status: PostingStatus) => Promise<void>,
  id: string
): Promise<"archived" | null> {
  const posting = await findPosting(id);

  if (!posting) return null;
  if (posting.pendingModificationId) {
    throw new ArchiveJobError(
      409,
      "A posting with a pending modification cannot be archived."
    );
  }

  await updateStatus(id, PostingStatus.ARCHIVED);
  return "archived";
}

async function archivePosting(id: string) {
  return prisma.$transaction(
    (transaction) =>
      archiveJobRecord(
        (postingId) =>
          transaction.jobPosting.findUnique({
            where: { id: postingId },
            select: {
              id: true,
              pendingModificationId: true,
            },
          }),
        async (postingId, status) => {
          await transaction.jobPosting.update({
            where: { id: postingId },
            data: { status },
          });
        },
        id
      ),
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function archiveJobPostingById(
  id: string
): Promise<"archived" | null> {
  let outcome: Awaited<ReturnType<typeof archivePosting>>;

  try {
    outcome = await archivePosting(id);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      outcome = await archivePosting(id);
    } else {
      throw error;
    }
  }

  return outcome;
}
