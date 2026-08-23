"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api, ApiError } from "@/lib/api";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import type { ProfileModel } from "@/lib/profile/to-profile-input";
import { profileQueryKeys } from "@/lib/profile/query-keys";

export function useProfileSave(mode: "create" | "update") {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: ProfileInput) =>
      api.put<ProfileModel>("/api/profile", values),
    retry: 0,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.detail(), profile);
      toast.success(
        mode === "create"
          ? "Profile created successfully"
          : "Profile updated successfully"
      );
      if (mode === "create") {
        router.replace("/");
      }
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
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
  };
}