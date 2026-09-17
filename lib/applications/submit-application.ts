import type { PrismaClient } from "@/generated/prisma/client";
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

// PENDING row so the admin table can render a scoring state immediately.
// The scoring task overwrites this row with COMPLETE or FAILED.
async function resetPendingScore(
  scores: Pick<PrismaClient["scoreResult"], "upsert">,
  applicationId: string
) {
  try {
    await scores.upsert({
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
    });
  } catch (error) {
    // Non-fatal: the scoring task upserts the row on its own run.
    console.warn("Failed to reset pending score", { applicationId, error });
  }
}

// The caller supplies the authenticated member ID, never a client-provided ID.
export async function submitApplication(
  applications: Pick<PrismaClient["application"], "findUnique" | "create" | "updateMany">,
  jobs: Pick<PrismaClient["jobPosting"], "findUnique">,
  scores: Pick<PrismaClient["scoreResult"], "upsert">,
  userId: string,
  input: CreateApplicationInput,
): Promise<SubmitApplicationResult> {
  const parsed = createApplicationSchema.parse(input);
  const job = await jobs.findUnique({
    where: { id: parsed.jobId },
    select: { id: true, status: true, deadline: true },
  });
  if (!job) throw new SubmitApplicationError(404, "Job posting not found");
  if (!isJobOpenForApplication(job)) {
    throw new SubmitApplicationError(400, "This job is no longer accepting applications");
  }

  const existing = await applications.findUnique({
    where: { jobId_studentId: { jobId: parsed.jobId, studentId: userId } },
    select: { id: true, status: true },
  });

  if (!existing) {
    const created = await applications.create({
      data: {
        jobId: parsed.jobId,
        studentId: userId,
        coverLetter: parsed.coverLetter,
        status: "APPLIED",
      },
    });
    await resetPendingScore(scores, created.id);
    return { outcome: "created", applicationId: created.id };
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
  await resetPendingScore(scores, existing.id);
  return { outcome: "reapplied", applicationId: existing.id };
}