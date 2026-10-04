"use client";

import { Spinner } from "@heroui/react";

export function InfiniteScrollLoader({ isFetching }: { isFetching: boolean }) {
  if (!isFetching) return null;

  return (
    <div
      role="status"
      aria-label="Loading more"
      className="flex h-16 items-center justify-center"
    >
      <span className="sr-only">Loading more</span>
      <Spinner.Root size="lg" className="text-foreground" />
    </div>
  );
}
