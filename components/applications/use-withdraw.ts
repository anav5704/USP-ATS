"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api, ApiError } from "@/lib/api";
import { applicationQueryKeys } from "@/lib/applications/query-keys";

export function useWithdraw() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (applicationId: string) =>
      api.patch<{ success: true }>(
        `/api/applications/${applicationId}/withdraw`
      ),
    retry: 0,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.all,
      });
      toast.success("Application withdrawn successfully.");
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
    withdrawAsync: mutation.mutateAsync,
  };
}