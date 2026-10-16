import { prisma } from "@/lib/prisma";

export class ArchiveJobError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type ArchivePosting = {
  id: string;
  status: string;
  pendingModificationId: string | null;
};

export async function archiveJobRecord(
  findPosting: (id: string) => Promise<ArchivePosting | null>,
  archiveActivePosting: (id: string) => Promise<boolean>,
  id: string
): Promise<"archived" | null> {
  // A single conditional write is enough for this one-field lifecycle change.
  // It also makes concurrent or repeated requests safe without an interactive
  // transaction against the remote database.
  if (await archiveActivePosting(id)) return "archived";

  const posting = await findPosting(id);
  if (!posting) return null;
  if (posting.pendingModificationId) {
    throw new ArchiveJobError(
      409,
      "A posting with a pending modification cannot be archived."
    );
  }
  if (posting.status === "ARCHIVED") return "archived";

  throw new ArchiveJobError(
    409,
    "Only active job postings can be archived."
  );
}

export async function archiveJobPostingById(
  id: string
): Promise<"archived" | null> {
  return archiveJobRecord(
    (postingId) =>
      prisma.jobPosting.findUnique({
        where: { id: postingId },
        select: {
          id: true,
          status: true,
          pendingModificationId: true,
        },
      }),
    async (postingId) => {
      const result = await prisma.jobPosting.updateMany({
        where: {
          id: postingId,
          status: "ACTIVE",
          pendingModificationId: null,
        },
        data: { status: "ARCHIVED" },
      });
      return result.count === 1;
    },
    id
  );
}
