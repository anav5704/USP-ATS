import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { createApplicationSchema, type CreateApplicationInput } from "@/lib/applications/application-schema";
import { blocksReapplication, isJobOpenForApplication } from "@/lib/applications/application-rules";

export class SubmitApplicationError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export type SubmitApplicationResult = {
  outcome: "created" | "reapplied";
  applicationId: string;
};

type SubmitDeps = {
  applications: Pick<
    PrismaClient["application"],
    "findUnique" | "create" | "updateMany"
  >;
  jobs: Pick<PrismaClient["jobPosting"], "findUnique">;
  scoreResult: Pick<PrismaClient["scoreResult"], "upsert">;
  transact: (
    operations: Prisma.PrismaPromise<unknown>[]
  ) => Promise<unknown[]>;
};

function pendingScoreReset(
  applicationId: string
): Prisma.ScoreResultUpsertArgs {
  return {
    where: { applicationId },
    update: {
      status: "PENDING",
      matchScore: null,
      skillsScore: null,
      educationScore: null,
      motivationScore: null,
      eligible: null,
      qualificationFit: null,
      motivationFit: null,
      missingRequirements: [],
    },
    create: { applicationId, status: "PENDING", missingRequirements: [] },
  };
}

// The caller supplies the authenticated member ID, never a client-provided ID.
export async function submitApplication(
  deps: SubmitDeps,
  userId: string,
  input: CreateApplicationInput,
): Promise<SubmitApplicationResult> {
  const { applications, jobs, scoreResult, transact } = deps;
  const parsed = createApplicationSchema.parse(input);
  const [job, existing] = await Promise.all([
    jobs.findUnique({
      where: { id: parsed.jobId },
      select: {
        id: true,
        status: true,
        deadline: true,
        pendingModificationId: true,
      },
    }),
    applications.findUnique({
      where: { jobId_studentId: { jobId: parsed.jobId, studentId: userId } },
      select: { id: true, status: true },
    }),
  ]);
  if (!job) throw new SubmitApplicationError(404, "Job posting not found");
  if (!isJobOpenForApplication(job)) {
    throw new SubmitApplicationError(400, "This job is no longer accepting applications");
  }

  if (!existing) {
    const applicationId = randomUUID();
    await transact([
      applications.create({
        data: {
          id: applicationId,
          jobId: parsed.jobId,
          studentId: userId,
          coverLetter: parsed.coverLetter,
          status: "APPLIED",
        },
      }),
      scoreResult.upsert(pendingScoreReset(applicationId)),
    ]);
    return { outcome: "created", applicationId };
  }

  if (blocksReapplication(existing.status)) {
    throw new SubmitApplicationError(409, "You have already applied for this job");
  }

  const result = await applications.updateMany({
    where: { id: existing.id, status: "WITHDRAWN" },
    data: { coverLetter: parsed.coverLetter, status: "APPLIED" },
  });
  if (result.count !== 1) {
    throw new SubmitApplicationError(409, "This application changed. Refresh and try again.");
  }
  // New cover letter means the old score is stale: reset and rescore.
  await scoreResult.upsert(pendingScoreReset(existing.id));
  return { outcome: "reapplied", applicationId: existing.id };
}
