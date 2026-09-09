export const jobQueryKeys = {
  all: ["jobs"] as const,
  adminLists: () => [...jobQueryKeys.all, "admin", "list"] as const,
  feed: () => [...jobQueryKeys.all, "feed"] as const,
  approvals: () => [...jobQueryKeys.all, "approvals"] as const,
};
