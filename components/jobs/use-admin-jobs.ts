"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

export function useAdminJobs() {
  return useQuery({
    queryKey: jobQueryKeys.adminLists(),
    queryFn: ({ signal }) =>
      api.get<AdminJobListItem[]>("/api/jobs/admin", { signal }),
    staleTime: 30_000,
    retry: 1,
  });
}