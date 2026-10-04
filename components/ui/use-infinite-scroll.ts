"use client";

import { useCallback, useEffect, useRef } from "react";

export function useInfiniteScroll({
  hasNextPage,
  isFetching,
  fetchNextPage,
  rootMargin = "800px",
}: {
  hasNextPage: boolean | undefined;
  isFetching: boolean;
  fetchNextPage: () => void;
  rootMargin?: string;
}) {
  const callbackRef = useRef({ hasNextPage, isFetching, fetchNextPage });

  useEffect(() => {
    callbackRef.current = { hasNextPage, isFetching, fetchNextPage };
  });

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          const current = callbackRef.current;
          if (!current.hasNextPage || current.isFetching) return;
          if (entries.some((entry) => entry.isIntersecting)) {
            current.fetchNextPage();
          }
        },
        { rootMargin }
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [rootMargin]
  );

  return sentinelRef;
}
