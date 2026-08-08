"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { removeJobPosting } from "@/lib/jobs/actions";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

export function useRemoveJob() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (jobId: string) => removeJobPosting(jobId),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: jobQueryKeys.adminLists(),
        });
        toast.success(
          result.outcome === "deleted"
            ? "Job posting permanently deleted"
            : "Job posting archived. Applications and scores were preserved."
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
    removeAsync: mutation.mutateAsync,
  };
}
