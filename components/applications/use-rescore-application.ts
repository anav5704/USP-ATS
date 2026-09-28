"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { applicationQueryKeys } from "@/lib/applications/query-keys";

export function useRescoreApplication(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) =>
      api.post<{ success: boolean; runId: string }>(
        `/api/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(
          applicationId
        )}/rescore`
      ),
    retry: 0,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.all,
      });
      toast.success("Re-scoring queued. The score will refresh shortly.");
    },
    onError: (error) => {
      toast.danger(
        error instanceof ApiError
          ? error.message
          : "Unable to queue re-scoring for this application."
      );
    },
  });
}
