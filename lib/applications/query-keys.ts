export const applicationQueryKeys = {
  all: ["applications"] as const,
  mine: () => [...applicationQueryKeys.all, "mine"] as const,
};