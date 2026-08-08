"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { createJobPosting, updateJobPosting } from "@/lib/jobs/actions";
import type { JobInput } from "@/lib/jobs/job-schema";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

export function useSaveJob(mode: "create" | "update", jobId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: JobInput) =>
      mode === "create"
        ? createJobPosting(values)
        : updateJobPosting(jobId ?? "", values),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: jobQueryKeys.adminLists(),
        });
        if (jobId) {
          await queryClient.invalidateQueries({
            queryKey: jobQueryKeys.adminDetail(jobId),
          });
        }
        toast.success(
          mode === "create"
            ? "Job posting created successfully"
            : "Job posting updated successfully"
        );
      } else {
        toast.danger(result.error);
      }
    },
    onError: () => {
      toast.danger("Something went wrong. Please try again.");
    },
  });

  return {
    isPending: mutation.isPending,
    saveAsync: mutation.mutateAsync,
  };
}
