"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import type {
  AdminApplicantDetail,
  AdminApplicantsResponse,
} from "@/lib/applications/application-schema";

export function useAdminApplicants(jobId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.adminJob(jobId),
    queryFn: ({ signal }) =>
      api.get<AdminApplicantsResponse>(
        `/api/jobs/${encodeURIComponent(jobId)}/applications`,
        { signal }
      ),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAdminApplicantDetail(
  jobId: string,
  applicationId: string
) {
  return useQuery({
    queryKey: applicationQueryKeys.adminDetail(jobId, applicationId),
    queryFn: ({ signal }) =>
      api.get<AdminApplicantDetail>(
        `/api/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(
          applicationId
        )}`,
        { signal }
      ),
    enabled: applicationId !== "",
    staleTime: 30_000,
    retry: 1,
  });
}
