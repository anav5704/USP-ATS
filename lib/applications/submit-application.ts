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

// The caller supplies the authenticated member ID, never a client-provided ID.
export async function submitApplication(
  applications: Pick<PrismaClient["application"], "findUnique" | "create" | "updateMany">,
  jobs: Pick<PrismaClient["jobPosting"], "findUnique">,
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
  return { outcome: "reapplied", applicationId: existing.id };
}