import { startOfFijiDay, todayInFiji } from "@/lib/jobs/job-dates";
import type {
  AdminApplicationStatus,
  ApplicationStatus,
} from "@/lib/applications/application-schema";

export function canWithdraw(status: ApplicationStatus): boolean {
  return status === "APPLIED";
}

export function blocksReapplication(status: ApplicationStatus): boolean {
  return status !== "WITHDRAWN";
}

export function allowedAdminStatusTargets(
  status: ApplicationStatus
): AdminApplicationStatus[] {
  if (status === "APPLIED") {
    return ["SHORTLISTED", "ACCEPTED", "DECLINED"];
  }
  if (status === "SHORTLISTED") {
    return ["ACCEPTED", "DECLINED"];
  }
  return [];
}

export function canAdminChangeStatus(
  current: ApplicationStatus,
  target: AdminApplicationStatus
): boolean {
  return allowedAdminStatusTargets(current).includes(target);
}

export function isJobOpenForApplication(
  job: {
    status: string;
    deadline: Date | string;
    pendingModificationId?: string | null;
  },
  todayFijiDate: string = todayInFiji()
): boolean {
  if (job.status !== "ACTIVE") return false;
  if (job.pendingModificationId) return false;
  return new Date(job.deadline) >= startOfFijiDay(todayFijiDate);
}
