"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApplicationListItem } from "@/lib/applications/application-schema";
import { applicationQueryKeys } from "@/lib/applications/query-keys";

export function useMyApplications() {
  return useQuery({
    queryKey: applicationQueryKeys.mine(),
    queryFn: ({ signal }) =>
      api.get<ApplicationListItem[]>("/api/applications", { signal }),
    staleTime: 30_000,
    retry: 1,
  });
}