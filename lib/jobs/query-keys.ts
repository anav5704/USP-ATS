import type {
  AdminJobFilters,
  StudentJobFilters,
} from "@/lib/jobs/job-filters";

export const jobQueryKeys = {
  all: ["jobs"] as const,
  adminLists: () => [...jobQueryKeys.all, "admin", "list"] as const,
  adminList: (filters: AdminJobFilters) =>
    [...jobQueryKeys.adminLists(), filters] as const,
  feed: () => [...jobQueryKeys.all, "feed"] as const,
  feedSections: (filters: StudentJobFilters) =>
    [...jobQueryKeys.feed(), "sections", filters] as const,
  approvals: () => [...jobQueryKeys.all, "approvals"] as const,
};
