import { z } from "zod";
import {
  JOB_TYPES,
  USP_CAMPUSES,
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

export const jobInputSchema = z.object({
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
    .array(z.enum(USP_CAMPUSES))
    .min(1, "Select at least one campus"),
  gpaMin: z
    .number()
    .min(0, "Minimum GPA must be between 0 and 4.5")
    .max(4.5, "Minimum GPA must be between 0 and 4.5")
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
    .min(0, "Hourly pay must be at least 0")
    .max(1000000, "Hourly pay is too large"),
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .refine(isCalendarDate, "Enter a valid deadline"),
});

export type JobInput = z.infer<typeof jobInputSchema>;

export type AdminJobListItem = {
  id: string;
  title: string;
  description: string;
  department: string;
  jobType: string;
  campus: string[];
  deadline: string;
  status: "ACTIVE" | "ARCHIVED";
  applicationCount: number;
  createdAt: string;
  hourlyPay: number;
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
  deadline: string;
};
