import { z } from "zod";
import { USP_CAMPUSES } from "@/lib/jobs/job-constants";

const optionalRequirement = (maximum: number, message: string) =>
  z.string().trim().max(maximum, message);

export const jobInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Job title is required")
    .max(200, "Job title is too long"),
  department: z
    .string()
    .trim()
    .min(1, "Department is required")
    .max(200, "Department is too long"),
  jobType: z
    .string()
    .trim()
    .min(1, "Job type is required")
    .max(100, "Job type is too long"),
  campus: z
    .array(z.enum(USP_CAMPUSES))
    .min(1, "Select at least one campus"),
  gpaMin: z
    .number()
    .min(0, "Minimum GPA must be between 0 and 4.5")
    .max(4.5, "Minimum GPA must be between 0 and 4.5")
    .nullable(),
  degree: optionalRequirement(500, "Degree requirement is too long"),
  skills: optionalRequirement(5000, "Skills requirement is too long"),
  hours: z
    .number({ error: "Enter the weekly hours" })
    .int("Weekly hours must be a whole number")
    .min(1, "Weekly hours must be at least 1")
    .max(168, "Weekly hours cannot exceed 168"),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid deadline")
    .refine(
      (value) => Number.isNaN(Date.parse(value)) || new Date(value) > new Date(),
      "Deadline must be in the future"
    ),
});

export type JobInput = z.infer<typeof jobInputSchema>;

export type AdminJobListItem = {
  id: string;
  title: string;
  department: string;
  jobType: string;
  campus: string[];
  deadline: string;
  status: "ACTIVE" | "ARCHIVED";
  applicationCount: number;
  createdAt: string;
};

export type AdminJobDetail = JobInput & {
  id: string;
};
