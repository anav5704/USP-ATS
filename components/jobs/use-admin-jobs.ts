"use client";

import { useQuery } from "@tanstack/react-query";
import { adminJobsPageOptions } from "@/lib/jobs/job-query-options";
import type { AdminJobFilters } from "@/lib/jobs/job-filters";

export function useAdminJobs(filters: AdminJobFilters, page: number) {
  return useQuery(adminJobsPageOptions(filters, page));
}
