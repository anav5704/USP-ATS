"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api, ApiError } from "@/lib/api";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";
import type { PageResult } from "@/lib/pagination";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

type ArchiveOutcome = { outcome: "archived" };

export function useArchiveJob() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (jobId: string) =>
      api.post<ArchiveOutcome>(`/api/jobs/${jobId}/archive`),
    retry: 0,
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({
        queryKey: jobQueryKeys.adminLists(),
      });
      const previous = queryClient.getQueriesData<
        PageResult<AdminJobListItem>
      >({
        queryKey: jobQueryKeys.adminLists(),
      });
      queryClient.setQueriesData<PageResult<AdminJobListItem>>(
        { queryKey: jobQueryKeys.adminLists() },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((job) =>
                  job.id === jobId
                    ? { ...job, status: "ARCHIVED" as const }
                    : job
                ),
              }
            : old
      );
      return { previous };
    },
    onError: (error, _jobId, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.danger(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
    onSuccess: () => {
      toast.success("Job posting archived. Applications and scores were preserved.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: jobQueryKeys.all,
      });
    },
  });

  return {
    isPending: mutation.isPending,
    archiveAsync: mutation.mutateAsync,
  };
}
