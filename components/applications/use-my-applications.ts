"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { myApplicationsInfiniteOptions } from "@/lib/applications/application-query-options";
import type { MyApplicationFilters } from "@/lib/applications/application-filters";

export function useMyApplications(filters: MyApplicationFilters) {
  return useInfiniteQuery(myApplicationsInfiniteOptions(filters));
}
