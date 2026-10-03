"use client";

import { useEffect, useRef } from "react";

export function useInfiniteScroll({
  hasNextPage,
  isFetching,
  fetchNextPage,
}: {
  hasNextPage: boolean | undefined;
  isFetching: boolean;
  fetchNextPage: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef({ fetchNextPage, isFetching });

  useEffect(() => {
    callbackRef.current = { fetchNextPage, isFetching };
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const { fetchNextPage, isFetching } = callbackRef.current;
        if (entries[0]?.isIntersecting && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching]);

  return sentinelRef;
}
