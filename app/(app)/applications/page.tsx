import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { MyApplications } from "@/components/applications/my-applications";
import { requireMemberPage } from "@/lib/jobs/require-member";
import { getQueryClient } from "@/lib/get-query-client";
import { myApplicationsInfiniteOptions } from "@/lib/applications/application-query-options";
import { getMyApplications } from "@/lib/applications/application-list-queries";
import { EMPTY_MY_APPLICATION_FILTERS } from "@/lib/applications/application-filters";
import { FEED_PAGE_SIZE } from "@/lib/pagination";

export default async function ApplicationsPage() {
  const session = await requireMemberPage();
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    ...myApplicationsInfiniteOptions(EMPTY_MY_APPLICATION_FILTERS),
    queryFn: ({ pageParam }) =>
      getMyApplications(
        session.user.id,
        EMPTY_MY_APPLICATION_FILTERS,
        Number(pageParam),
        FEED_PAGE_SIZE
      ),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyApplications />
    </HydrationBoundary>
  );
}
