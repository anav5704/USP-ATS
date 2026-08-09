"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminJobPosting, getAdminJobPostings } from "@/lib/jobs/actions";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

export function useAdminJobs() {
  return useQuery({
    queryKey: jobQueryKeys.adminLists(),
    queryFn: async () => {
      const result = await getAdminJobPostings();
      if (!result.success) throw new Error(result.error);
      return result.jobs;
    },
  });
}

export function useAdminJob(id: string) {
  return useQuery({
    queryKey: jobQueryKeys.adminDetail(id),
    queryFn: async () => {
      const result = await getAdminJobPosting(id);
      if (!result.success) throw new Error(result.error);
      return result.job;
    },
  });
}
