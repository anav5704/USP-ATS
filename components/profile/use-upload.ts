"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api, ApiError } from "@/lib/api";
import type { FileRef } from "@/lib/profile/profile-schema";

export function useUploadProfileFiles() {
  const mutation = useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      const result = await api.upload<{ files: FileRef[] }>(
        "/api/profile/uploads",
        form
      );
      return result.files;
    },
    onError: (error) => {
      toast.danger(
        error instanceof ApiError
          ? error.message
          : "Unable to upload file. Please try again."
      );
    },
  });

  return {
    isUploading: mutation.isPending,
    uploadAsync: mutation.mutateAsync,
  };
}