"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { createProfile, updateProfile } from "@/lib/profile/actions";
import type { ProfileInput } from "@/lib/profile/profile-schema";

export function useProfileSave(mode: "create" | "update") {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: ProfileInput) =>
      mode === "create" ? createProfile(values) : updateProfile(values),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          mode === "create"
            ? "Profile created successfully"
            : "Profile updated successfully"
        );
        if (mode === "create") {
          router.replace("/");
        } else {
          router.refresh();
        }
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
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
  };
}
