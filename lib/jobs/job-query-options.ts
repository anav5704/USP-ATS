import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import {
  jobFiltersToSearchParams,
  type AdminJobFilters,
  type StudentJobFilters,
} from "@/lib/jobs/job-filters";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";
import type { FeedGroup, FeedSectionsPage } from "@/lib/jobs/job-list-queries";
import type { ApprovalPage } from "@/lib/jobs/approval-queries";
import {
  approvalFiltersToSearchParams,
  type ApprovalFilters,
  type ApprovalTab,
} from "@/lib/jobs/approval-filters";
import {
  ADMIN_PAGE_SIZE,
  FEED_PAGE_SIZE,
  type PageResult,
} from "@/lib/pagination";

export function jobSectionsInfiniteOptions(
  filters: StudentJobFilters,
  group: FeedGroup
) {
  return infiniteQueryOptions({
    queryKey: jobQueryKeys.feedSections(filters, group),
    queryFn: ({ signal, pageParam }) =>
      api.get<FeedSectionsPage>(
        `/api/jobs?group=${group}&page=${pageParam}&pageSize=${FEED_PAGE_SIZE}&${jobFiltersToSearchParams(filters)}`,
        { signal }
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.pageSize < lastPage.total
        ? lastPage.page + 1
        : undefined,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
    retry: 1,
  });
}

export function adminJobsPageOptions(filters: AdminJobFilters, page: number) {
  return queryOptions({
    queryKey: jobQueryKeys.adminList(filters, page),
    queryFn: ({ signal }) =>
      api.get<PageResult<AdminJobListItem>>(
        `/api/jobs/admin?page=${page}&pageSize=${ADMIN_PAGE_SIZE}&${jobFiltersToSearchParams(filters)}`,
        { signal }
      ),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export function approvalsPageOptions(
  filters: ApprovalFilters,
  tab: ApprovalTab,
  page: number
) {
  return queryOptions({
    queryKey: jobQueryKeys.approvalsPage(filters, tab, page),
    queryFn: ({ signal }) =>
      api.get<ApprovalPage>(
        `/api/jobs/approvals?tab=${tab}&page=${page}&pageSize=${ADMIN_PAGE_SIZE}&${approvalFiltersToSearchParams(filters)}`,
        { signal }
      ),
    staleTime: 30_000,
    refetchInterval: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}
