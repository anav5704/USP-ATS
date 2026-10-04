"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import { adminApplicantsPageOptions } from "@/lib/applications/application-query-options";
import type { AdminApplicantListItem } from "@/lib/applications/application-schema";

export function adminApplicantsQueryOptions(jobId: string, page: number) {
  return adminApplicantsPageOptions(jobId, page);
}

export function useAdminApplicants(jobId: string, page: number) {
  return useQuery(adminApplicantsQueryOptions(jobId, page));
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
