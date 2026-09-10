"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import type {
  AdminApplicationStatus,
  ApplicationStatus,
} from "@/lib/applications/application-schema";

export function useUpdateApplicationStatus(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: AdminApplicationStatus;
    }) =>
      api.patch<{ id: string; status: ApplicationStatus }>(
        `/api/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(
          applicationId
        )}`,
        { status }
      ),
    retry: 0,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.all,
      });
      toast.success("Application status updated successfully.");
    },
    onError: (error) => {
      toast.danger(
        error instanceof ApiError
          ? error.message
          : "Unable to update the application status."
      );
    },
  });
}
