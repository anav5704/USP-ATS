"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { adminJobsInfiniteOptions } from "@/lib/jobs/job-query-options";
import type { AdminJobFilters } from "@/lib/jobs/job-filters";

export function useAdminJobs(filters: AdminJobFilters) {
  return useInfiniteQuery(adminJobsInfiniteOptions(filters));
}
