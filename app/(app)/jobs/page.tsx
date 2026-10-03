import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { JobFeed } from "@/components/jobs/job-feed";
import { requireMemberPage } from "@/lib/jobs/require-member";
import { getQueryClient } from "@/lib/get-query-client";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import { getStudentJobFeed } from "@/lib/jobs/job-list-queries";
import { getMyApplications } from "@/lib/applications/application-list-queries";

export default async function JobsPage() {
  const session = await requireMemberPage();
  const queryClient = getQueryClient();

  // Prefetch in parallel; client hooks mount with data (no spinner) and
  // refetch in background only after staleTime.
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: jobQueryKeys.feed(),
      queryFn: getStudentJobFeed,
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      queryKey: applicationQueryKeys.mine(),
      queryFn: () => getMyApplications(session.user.id),
      staleTime: 30_000,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JobFeed />
    </HydrationBoundary>
  );
}
