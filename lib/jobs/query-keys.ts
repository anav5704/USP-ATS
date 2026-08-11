export const jobQueryKeys = {
  all: ["jobs"] as const,
  adminLists: () => [...jobQueryKeys.all, "admin", "list"] as const,
  adminDetail: (id: string) => [...jobQueryKeys.all, "admin", "detail", id] as const,
  feed: () => [...jobQueryKeys.all, "feed"] as const,
};
