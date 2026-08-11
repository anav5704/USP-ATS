"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentJobPostings } from "@/lib/jobs/actions";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

export function useJobFeed() {
  return useQuery({
    queryKey: jobQueryKeys.feed(),
    queryFn: async () => {
      const result = await getStudentJobPostings();
      if (!result.success) throw new Error(result.error);
      return result.jobs;
    },
  });
}
