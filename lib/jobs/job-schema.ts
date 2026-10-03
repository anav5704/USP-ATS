import { z } from "zod";
import { getJobTemplate } from "@/lib/jobs/job-templates";
import {
  JOB_TYPES,
  USP_CAMPUSES_CENTRES,
  USP_DEPARTMENTS,
} from "@/lib/jobs/job-constants";

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const jobSnapshotSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Job title is required")
    .max(200, "Job title is too long"),
  description: z
    .string()
    .trim()
    .min(1, "Job description is required")
    .max(10000, "Job description is too long"),
  department: z.enum(USP_DEPARTMENTS, {
    error: "Select a department",
  }),
  jobType: z.enum(JOB_TYPES, {
    error: "Select a job type",
  }),
  campus: z
    .array(z.enum(USP_CAMPUSES_CENTRES))
    .min(1, "Select at least one campus or centre"),
  gpaMin: z
    .number()
    .min(0, "GPA Required must be between 0 and 4.5")
    .max(4.5, "GPA Required must be between 0 and 4.5")
    .nullable(),
  degree: z
    .array(z.string().trim().min(1, "Degree name is required"))
    .max(20, "Too many degrees"),
  skills: z
    .array(z.string().trim().min(1, "Skill name is required"))
    .max(10, "You can select up to 10 skills"),
  hours: z
    .number({ error: "Enter the weekly hours" })
    .int("Weekly hours must be a whole number")
    .min(1, "Weekly hours must be at least 1")
    .max(168, "Weekly hours cannot exceed 168"),
  hourlyPay: z
    .number({ error: "Enter the hourly pay" })
    .min(0, "Hourly pay cannot be negative.")
    .max(1000000, "Hourly pay is too large"),
  benefit: z.string().trim().max(500, "Benefit or perk is too long"),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .refine(isCalendarDate, "Enter a valid deadline"),
});

export type JobInput = z.infer<typeof jobSnapshotSchema>;

const payValidationFields = jobSnapshotSchema.pick({ jobType: true, hourlyPay: true });

export const jobInputSchema = jobSnapshotSchema.superRefine((job, ctx) => {
  const template = getJobTemplate(job.title);
  if (template && job.jobType !== template.jobType) {
    ctx.addIssue({
      code: "custom",
      path: ["jobType"],
      message: `Job type must be ${template.jobType} for the selected job title.`,
    });
  }
}).refine((job) => job.jobType === "Volunteer" || job.hourlyPay !== 0, {
  path: ["hourlyPay"],
  message: "Hourly pay must be greater than 0 for non-volunteer jobs.",
  // Unfinished, unrelated fields must not suppress live pay validation.
  when: ({ value }) => payValidationFields.safeParse(value).success,
});

export type AdminJobListItem = {
  id: string;
  title: string;
  description: string;
  department: string;
  jobType: string;
  campus: string[];
  deadline: string;
  status: "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "ARCHIVED";
  applicationCount: number;
  createdAt: string;
  hourlyPay: number;
  benefit: string | null;
  gpaMin: number | null;
  degree: string[];
  skills: string[];
  hours: number;
  rejectionReason?: string | null;
};

export type ApprovalJob = AdminJobListItem & {
  approvalId: string;
  jobId: string;
  requestType: "NEW_JOB" | "MODIFICATION";
  approvalStatus: "Pending Approval" | "Approved" | "Rejected";
  originalJob: JobInput | null;
  approvedBy: { name: string; email: string } | null;
  rejectedBy: { name: string; email: string } | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdById: string;
  requestedById: string | null;
  createdBy: { name: string; email: string };
  requestedBy: { name: string; email: string } | null;
  requestedAt: string;
  revision: number;
};

export type AdminJobDetail = JobInput & {
  id: string;
};

export type StudentJobListItem = {
  id: string;
  title: string;
  description: string;
  department: string;
  jobType: string;
  campus: string[];
  gpaMin: number | null;
  degree: string[];
  skills: string[];
  hours: number | null;
  hourlyPay: number;
  benefit: string | null;
  deadline: string;
  createdAt: string;
};

export type JobFeedSections = {
  campusMatchedJobs: StudentJobListItem[];
  degreeMatchedJobs: StudentJobListItem[];
  otherJobs: StudentJobListItem[];
};
