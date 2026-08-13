"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProfileModel } from "@/lib/profile/to-profile-input";
import { profileQueryKeys } from "@/lib/profile/query-keys";

export function useProfile(initialData?: ProfileModel | null, enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.detail(),
    queryFn: ({ signal }) =>
      api.get<ProfileModel>("/api/profile", { signal }),
    initialData: initialData ?? undefined,
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}