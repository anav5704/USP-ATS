"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JobFeedSections } from "@/lib/jobs/job-schema";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import {
  jobFiltersToSearchParams,
  type StudentJobFilters,
} from "@/lib/jobs/job-filters";

export function useJobFeed(filters: StudentJobFilters) {
  return useQuery({
    queryKey: jobQueryKeys.feedSections(filters),
    queryFn: ({ signal }) =>
      api.get<JobFeedSections>(
        `/api/jobs?grouped=1&${jobFiltersToSearchParams(filters)}`,
        { signal }
      ),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
