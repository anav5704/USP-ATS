export const applicationQueryKeys = {
  all: ["applications"] as const,
  mine: () => [...applicationQueryKeys.all, "mine"] as const,
  adminJob: (jobId: string) =>
    [...applicationQueryKeys.all, "admin", "job", jobId] as const,
  adminApplicantDetail: (jobId: string, applicationId: string) =>
    [...applicationQueryKeys.all, "admin", "job", jobId, applicationId] as const,
};
