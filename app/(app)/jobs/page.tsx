import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { JobFeed } from "@/components/jobs/job-feed";
import { requireMemberPage } from "@/lib/jobs/require-member";
import { getQueryClient } from "@/lib/get-query-client";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import { getStudentJobSections } from "@/lib/jobs/job-list-queries";
import { getMyApplications } from "@/lib/applications/application-list-queries";
import { getProfileModel } from "@/lib/profile/profile-queries";
import { profileQueryKeys } from "@/lib/profile/query-keys";
import { EMPTY_STUDENT_JOB_FILTERS } from "@/lib/jobs/job-filters";

export default async function JobsPage() {
  const session = await requireMemberPage();
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: jobQueryKeys.feedSections(EMPTY_STUDENT_JOB_FILTERS),
      queryFn: () => getStudentJobSections(session.user.id, EMPTY_STUDENT_JOB_FILTERS),
      staleTime: 60_000,
    }),
    queryClient.prefetchQuery({
      queryKey: applicationQueryKeys.mine(),
      queryFn: () => getMyApplications(session.user.id),
      staleTime: 30_000,
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
