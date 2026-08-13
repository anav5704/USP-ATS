"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api, ApiError } from "@/lib/api";
import type { JobInput } from "@/lib/jobs/job-schema";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

export function useSaveJob(mode: "create" | "update", jobId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: JobInput) =>
      mode === "create"
        ? api.post<{ success: true }>("/api/jobs", values)
        : api.patch<{ success: true }>(`/api/jobs/${jobId ?? ""}`, values),
    retry: 0,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobQueryKeys.adminLists(),
      });
      toast.success(
        mode === "create"
          ? "Job posting created successfully"
          : "Job posting updated successfully"
      );
    },
    onError: (error) => {
      toast.danger(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  return {
    isPending: mutation.isPending,
    saveAsync: mutation.mutateAsync,
  };
}