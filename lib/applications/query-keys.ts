import type { MyApplicationFilters } from "@/lib/applications/application-filters";

export const applicationQueryKeys = {
  all: ["applications"] as const,
  mine: () => [...applicationQueryKeys.all, "mine"] as const,
  minePage: (filters: MyApplicationFilters) =>
    [...applicationQueryKeys.mine(), filters] as const,
  adminJob: (jobId: string) =>
    [...applicationQueryKeys.all, "admin", "job", jobId] as const,
  adminJobPage: (jobId: string, page: number) =>
    [...applicationQueryKeys.adminJob(jobId), page] as const,
  adminApplicantDetail: (jobId: string, applicationId: string) =>
    [...applicationQueryKeys.all, "admin", "job", jobId, applicationId] as const,
};
