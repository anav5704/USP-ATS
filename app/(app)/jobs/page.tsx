import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { JobFeed } from "@/components/jobs/job-feed";
import { requireMemberPage } from "@/lib/jobs/require-member";
import { getQueryClient } from "@/lib/get-query-client";
import { jobSectionsInfiniteOptions } from "@/lib/jobs/job-query-options";
import { getStudentJobSections } from "@/lib/jobs/job-list-queries";
import { getProfileModel } from "@/lib/profile/profile-queries";
import { profileQueryKeys } from "@/lib/profile/query-keys";
import { EMPTY_STUDENT_JOB_FILTERS } from "@/lib/jobs/job-filters";
import { FEED_PAGE_SIZE } from "@/lib/pagination";

export default async function JobsPage() {
  const session = await requireMemberPage();
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      ...jobSectionsInfiniteOptions(EMPTY_STUDENT_JOB_FILTERS, "campus"),
      queryFn: ({ pageParam }) =>
        getStudentJobSections(
          session.user.id,
          EMPTY_STUDENT_JOB_FILTERS,
          "campus",
          Number(pageParam),
          FEED_PAGE_SIZE
        ),
    }),
    queryClient.prefetchInfiniteQuery({
      ...jobSectionsInfiniteOptions(EMPTY_STUDENT_JOB_FILTERS, "degree"),
      queryFn: ({ pageParam }) =>
        getStudentJobSections(
          session.user.id,
          EMPTY_STUDENT_JOB_FILTERS,
          "degree",
          Number(pageParam),
          FEED_PAGE_SIZE
        ),
    }),
    queryClient.prefetchInfiniteQuery({
      ...jobSectionsInfiniteOptions(EMPTY_STUDENT_JOB_FILTERS, "other"),
      queryFn: ({ pageParam }) =>
        getStudentJobSections(
          session.user.id,
          EMPTY_STUDENT_JOB_FILTERS,
          "other",
          Number(pageParam),
          FEED_PAGE_SIZE
        ),
    }),
    queryClient.prefetchQuery({
      queryKey: profileQueryKeys.detail(),
      queryFn: () => getProfileModel(session.user.id),
      staleTime: 5 * 60_000,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JobFeed />
    </HydrationBoundary>
  );
}
