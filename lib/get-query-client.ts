import { QueryClient } from "@tanstack/react-query";

// Per-request server QueryClient for RSC prefetch. Never cache globally;
// each server render creates its own instance and dehydrates it into a
// HydrationBoundary so client useQuery hooks mount with data (no spinner).
export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  });
}
