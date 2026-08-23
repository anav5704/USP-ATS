"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StudentJobListItem } from "@/lib/jobs/job-schema";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

export function useJobFeed() {
  return useQuery({
    queryKey: jobQueryKeys.feed(),
    queryFn: ({ signal }) =>
      api.get<StudentJobListItem[]>("/api/jobs", { signal }),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}