import { infiniteQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import type {
  AdminApplicantsTablePage,
  ApplicationListItem,
} from "@/lib/applications/application-schema";
import {
  myApplicationFiltersToSearchParams,
  type MyApplicationFilters,
} from "@/lib/applications/application-filters";
import {
  ADMIN_PAGE_SIZE,
  FEED_PAGE_SIZE,
  type PageResult,
} from "@/lib/pagination";

export function myApplicationsInfiniteOptions(filters: MyApplicationFilters) {
  return infiniteQueryOptions({
    queryKey: applicationQueryKeys.minePage(filters),
    queryFn: ({ signal, pageParam }) =>
      api.get<PageResult<ApplicationListItem>>(
        `/api/applications?page=${pageParam}&pageSize=${FEED_PAGE_SIZE}&${myApplicationFiltersToSearchParams(filters)}`,
        { signal }
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.pageSize < lastPage.total
        ? lastPage.page + 1
        : undefined,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    retry: 1,
  });
}

export function adminApplicantsInfiniteOptions(jobId: string) {
  return infiniteQueryOptions({
    queryKey: applicationQueryKeys.adminJob(jobId),
    queryFn: ({ signal, pageParam }) =>
      api.get<AdminApplicantsTablePage>(
        `/api/jobs/${encodeURIComponent(jobId)}/applications?page=${pageParam}&pageSize=${ADMIN_PAGE_SIZE}`,
        { signal }
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.pageSize < lastPage.total
        ? lastPage.page + 1
        : undefined,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    retry: 1,
  });
}
