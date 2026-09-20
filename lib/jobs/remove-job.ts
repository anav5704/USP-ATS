import { prisma } from "@/lib/prisma";
import { PostingStatus, Prisma } from "@/generated/prisma/client";

export class RemoveJobError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function decideRemoval(id: string) {
  return prisma.$transaction(
    async (transaction) => {
      const posting = await transaction.jobPosting.findUnique({
        where: { id },
        select: {
          id: true,
          pendingModificationId: true,
          _count: { select: { applications: true } },
        },
      });

      if (!posting) return null;
      if (posting.pendingModificationId) {
        throw new RemoveJobError(
          409,
          "A posting with a pending modification cannot be removed."
        );
      }

      if (posting._count.applications === 0) {
        await transaction.jobPosting.delete({ where: { id } });
        return "deleted" as const;
      }

      await transaction.jobPosting.update({
        where: { id },
        data: { status: PostingStatus.ARCHIVED },
      });
      return "archived" as const;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function removeJobPostingById(
  id: string
): Promise<"deleted" | "archived" | null> {
  let outcome: Awaited<ReturnType<typeof decideRemoval>>;

  try {
    outcome = await decideRemoval(id);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      outcome = await decideRemoval(id);
    } else {
      throw error;
    }
  }

  return outcome;
}
