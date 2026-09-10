import { startOfFijiDay, todayInFiji } from "@/lib/jobs/job-dates";
import type { ApplicationStatus } from "@/lib/applications/application-schema";

export function canWithdraw(status: ApplicationStatus): boolean {
  return status === "APPLIED";
}

export function blocksReapplication(status: ApplicationStatus): boolean {
  return status !== "WITHDRAWN";
}

export function isJobOpenForApplication(
  job: { status: string; deadline: Date | string },
  todayFijiDate: string = todayInFiji()
): boolean {
  if (job.status !== "ACTIVE") return false;
  return new Date(job.deadline) >= startOfFijiDay(todayFijiDate);
}