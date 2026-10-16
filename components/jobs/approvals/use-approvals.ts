"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api } from "@/lib/api";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import type { ApprovalInput } from "@/lib/jobs/approval-schema";
import type { ApprovalJob } from "@/lib/jobs/job-schema";
import { approvalsPageOptions } from "@/lib/jobs/job-query-options";
import type {
  ApprovalFilters,
  ApprovalTab,
} from "@/lib/jobs/approval-filters";

export function useApprovals(
  filters: ApprovalFilters,
  tab: ApprovalTab,
  page: number
) {
  return useQuery(approvalsPageOptions(filters, tab, page));
}

export function useReviewJob(job: ApprovalJob) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ApprovalInput) =>
      api.post(
        job.requestType !== "NEW_JOB"
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
            ? job.requestType === "UNARCHIVE"
              ? "Unarchive request approved; job posting is active"
              : job.requestType === "MODIFICATION"
                ? "Job modification approved and applied"
                : "Job posting approved and active"
            : job.requestType === "UNARCHIVE"
              ? "Unarchive request rejected; archived posting was preserved"
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
