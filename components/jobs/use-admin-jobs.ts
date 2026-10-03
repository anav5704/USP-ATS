"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import {
  jobFiltersToSearchParams,
  type AdminJobFilters,
} from "@/lib/jobs/job-filters";

export function useAdminJobs(filters: AdminJobFilters) {
  return useQuery({
    queryKey: jobQueryKeys.adminList(filters),
    queryFn: ({ signal }) =>
      api.get<AdminJobListItem[]>(
        `/api/jobs/admin?${jobFiltersToSearchParams(filters)}`,
        { signal }
      ),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
