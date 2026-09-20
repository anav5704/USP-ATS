"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api } from "@/lib/api";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import type { ApprovalJob } from "@/lib/jobs/job-schema";
import type { ApprovalInput } from "@/lib/jobs/approval-schema";

export function useApprovals() {
  return useQuery({
    queryKey: jobQueryKeys.approvals(),
    queryFn: ({ signal }) => api.get<ApprovalJob[]>("/api/jobs/approvals", { signal }),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useReviewJob(job: ApprovalJob) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ApprovalInput) =>
      api.post(
        job.requestType === "MODIFICATION"
          ? `/api/jobs/${job.jobId}/modifications/${job.approvalId}/review`
          : `/api/jobs/${job.jobId}/review`,
        input
      ),
    retry: 0,
    onSuccess: async (_data, input) => {
      await client.invalidateQueries({ queryKey: jobQueryKeys.all });
      toast.success(
        input.decision === "withdraw"
          ? "Approval request withdrawn"
          : input.decision === "approve"
            ? job.requestType === "MODIFICATION"
              ? "Job modification approved and applied"
              : "Job posting approved and active"
            : job.requestType === "MODIFICATION"
              ? "Job modification rejected; approved values were preserved"
              : "Job posting rejected"
      );
    },
    onError: async () => {
      await client.invalidateQueries({ queryKey: jobQueryKeys.all });
    },
  });
}
