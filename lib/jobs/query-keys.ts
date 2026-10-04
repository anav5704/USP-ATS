import type {
  AdminJobFilters,
  StudentJobFilters,
} from "@/lib/jobs/job-filters";
import type { FeedGroup } from "@/lib/jobs/job-list-queries";
import type { ApprovalFilters } from "@/lib/jobs/approval-filters";

export const jobQueryKeys = {
  all: ["jobs"] as const,
  adminLists: () => [...jobQueryKeys.all, "admin", "list"] as const,
  adminList: (filters: AdminJobFilters, page: number) =>
    [...jobQueryKeys.adminLists(), filters, page] as const,
  feed: () => [...jobQueryKeys.all, "feed"] as const,
  feedSections: (filters: StudentJobFilters, group: FeedGroup) =>
    [...jobQueryKeys.feed(), "sections", filters, group] as const,
  approvals: () => [...jobQueryKeys.all, "approvals"] as const,
  approvalsPage: (filters: ApprovalFilters, tab: string, page: number) =>
    [...jobQueryKeys.approvals(), filters, tab, page] as const,
};
