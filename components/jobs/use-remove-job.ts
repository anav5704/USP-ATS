"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api, ApiError } from "@/lib/api";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

type RemoveOutcome = { outcome: "deleted" | "archived" };

export function useRemoveJob() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (jobId: string) =>
      api.delete<RemoveOutcome>(`/api/jobs/${jobId}`),
    retry: 0,
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({
        queryKey: jobQueryKeys.adminLists(),
      });
      const previous = queryClient.getQueryData<AdminJobListItem[]>(
        jobQueryKeys.adminLists()
      );
      if (previous) {
        queryClient.setQueryData(
          jobQueryKeys.adminLists(),
          previous.filter((job) => job.id !== jobId)
        );
      }
      return { previous };
    },
    onError: (error, _jobId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(jobQueryKeys.adminLists(), context.previous);
      }
      toast.danger(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
    onSuccess: (result) => {
      toast.success(
        result.outcome === "deleted"
          ? "Job posting permanently deleted"
          : "Job posting archived. Applications and scores were preserved."
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: jobQueryKeys.adminLists(),
      });
    },
  });

  return {
    isPending: mutation.isPending,
    removeAsync: mutation.mutateAsync,
  };
}