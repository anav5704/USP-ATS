"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import type { AdminApplicantsResponse } from "@/lib/applications/application-schema";

export function adminApplicantsQueryOptions(jobId: string) {
  return queryOptions({
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

export function useAdminApplicants(jobId: string) {
  return useQuery(adminApplicantsQueryOptions(jobId));
}
