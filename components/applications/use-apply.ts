"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api, ApiError } from "@/lib/api";
import type { CreateApplicationInput } from "@/lib/applications/application-schema";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import { jobQueryKeys } from "@/lib/jobs/query-keys";

export function useApply() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: CreateApplicationInput) =>
      api.post<{ success: true }>("/api/applications", values),
    retry: 0,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: applicationQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: jobQueryKeys.feed(),
        }),
      ]);
      toast.success("Application submitted successfully.");
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
    applyAsync: mutation.mutateAsync,
  };
}
