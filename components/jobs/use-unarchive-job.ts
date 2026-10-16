"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api, ApiError } from "@/lib/api";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import type { UnarchiveJobInput } from "@/lib/jobs/job-schema";
import type { UnarchiveOutcome } from "@/lib/jobs/unarchive-job";

export function useUnarchiveJob() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      jobId,
      input,
    }: {
      jobId: string;
      input?: UnarchiveJobInput;
    }) =>
      api.post<UnarchiveOutcome>(
        `/api/jobs/${jobId}/unarchive`,
        input ?? {}
      ),
    retry: 0,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: jobQueryKeys.all });
      toast.success(
        result.outcome === "active"
          ? "Job posting unarchived and active"
          : "Unarchive request submitted for approval"
      );
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: jobQueryKeys.all });
      toast.danger(
        error instanceof ApiError
          ? error.message
          : "Unable to unarchive the job posting"
      );
    },
  });

  return mutation;
}
