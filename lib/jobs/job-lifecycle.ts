export type JobLifecycleStatus =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "REJECTED"
  | "ARCHIVED";

export function effectiveJobStatus(
  job: { status: JobLifecycleStatus; deadline: Date | string },
  now: Date = new Date()
): JobLifecycleStatus {
  if (
    job.status === "ACTIVE" &&
    new Date(job.deadline).getTime() < now.getTime()
  ) {
    return "ARCHIVED";
  }

  return job.status;
}
