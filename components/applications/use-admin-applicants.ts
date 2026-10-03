"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import type {
  AdminApplicantListItem,
  AdminApplicantsTableResponse,
} from "@/lib/applications/application-schema";

export function adminApplicantsQueryOptions(jobId: string) {
  return queryOptions({
    queryKey: applicationQueryKeys.adminJob(jobId),
    queryFn: ({ signal }) =>
      api.get<AdminApplicantsTableResponse>(
        `/api/jobs/${encodeURIComponent(jobId)}/applications`,
        { signal }
      ),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAdminApplicants(jobId: string) {
  return useQuery(adminApplicantsQueryOptions(jobId));
}

export function applicantDetailsQueryOptions(
  jobId: string,
  applicationId: string
) {
  return queryOptions({
    queryKey: applicationQueryKeys.adminApplicantDetail(jobId, applicationId),
    queryFn: ({ signal }) =>
      api.get<AdminApplicantListItem>(
        `/api/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(
          applicationId
        )}`,
        { signal }
      ),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useApplicantDetails(
  jobId: string,
  applicationId: string | null
) {
  return useQuery({
    ...applicantDetailsQueryOptions(jobId, applicationId ?? ""),
    enabled: applicationId !== null,
  });
}
