"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { jobSectionsInfiniteOptions } from "@/lib/jobs/job-query-options";
import type { StudentJobFilters } from "@/lib/jobs/job-filters";
import type { FeedGroup } from "@/lib/jobs/job-list-queries";

export function useJobFeed(filters: StudentJobFilters, group: FeedGroup) {
  return useInfiniteQuery(jobSectionsInfiniteOptions(filters, group));
}
