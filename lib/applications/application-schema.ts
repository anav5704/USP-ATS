import { z } from "zod";
import type { StudentJobListItem } from "@/lib/jobs/job-schema";

export const APPLICATION_STATUSES = [
  "APPLIED",
  "SHORTLISTED",
  "ACCEPTED",
  "DECLINED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const coverLetterSchema = z
  .string()
  .trim()
  .min(1, "Cover letter is required")
  .max(2000, "Cover letter is too long");

export const createApplicationSchema = z.object({
  jobId: z.string().min(1, "Job id is required"),
  coverLetter: coverLetterSchema,
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export type ApplicationListItem = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  coverLetter: string;
  job: StudentJobListItem;
};