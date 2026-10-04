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

export const APPLICATION_STATUS_LABELS = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  WITHDRAWN: "Withdrawn",
} as const;

export const ADMIN_APPLICATION_STATUSES = [
  "SHORTLISTED",
  "ACCEPTED",
  "DECLINED",
] as const;

export const adminApplicationStatusSchema = z.enum(ADMIN_APPLICATION_STATUSES);
export type AdminApplicationStatus = z.infer<
  typeof adminApplicationStatusSchema
>;

export const updateApplicationStatusSchema = z.object({
  status: adminApplicationStatusSchema,
});

export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;

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

const adminProfileFileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().int(),
  url: z.string(),
});

const adminApplicantProfileSchema = z
  .object({
    phone: z.string().nullable(),
    bio: z.string().nullable(),
    campuses: z.array(z.string()),
    skills: z.array(z.string()),
    degrees: z.array(
      z.object({
        name: z.string(),
        gpa: z.number(),
        documentType: z.enum(["TRANSCRIPT", "DEGREE"]),
        document: adminProfileFileSchema,
      })
    ),
    certificates: z.array(
      z.object({
        label: z.string(),
        organization: z.string().nullable(),
        url: z.string().nullable(),
        uploadedAt: z.string(),
        file: adminProfileFileSchema,
      })
    ),
    socialLinks: z.array(
      z.object({ platform: z.string(), url: z.string() })
    ),
    profileLinks: z.array(z.object({ title: z.string(), url: z.string() })),
  })
  .nullable();

const adminApplicantDataSchema = z.object({
  id: z.string(),
  status: z.enum(APPLICATION_STATUSES),
  createdAt: z.string(),
  coverLetter: z.string(),
  applicant: z.object({
    name: z.string(),
    email: z.string(),
    profile: adminApplicantProfileSchema,
  }),
});

const adminApplicantListItemSchema = adminApplicantDataSchema.extend({
  score: z
    .object({
      matchScore: z.number().int().nullable(),
      status: z.enum(["PENDING", "COMPLETE", "FAILED"]),
    })
    .nullable(),
});

const adminApplicantTableItemSchema = z.object({
  id: z.string(),
  status: z.enum(APPLICATION_STATUSES),
  createdAt: z.string(),
  score: z
    .object({
      matchScore: z.number().int().nullable(),
      status: z.enum(["PENDING", "COMPLETE", "FAILED"]),
    })
    .nullable(),
  applicant: z.object({
    name: z.string(),
    campuses: z.array(z.string()),
  }),
});

const adminApplicantsJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  department: z.string(),
  campus: z.array(z.string()),
});

export type AdminApplicantListItem = z.infer<
  typeof adminApplicantListItemSchema
>;
export type AdminApplicantTableItem = z.infer<
  typeof adminApplicantTableItemSchema
>;

export type AdminApplicantsTablePage = {
  job: z.infer<typeof adminApplicantsJobSchema>;
  items: AdminApplicantTableItem[];
  total: number;
  page: number;
  pageSize: number;
};
