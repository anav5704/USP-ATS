import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { MyApplications } from "@/components/applications/my-applications";
import { requireMemberPage } from "@/lib/jobs/require-member";
import { getQueryClient } from "@/lib/get-query-client";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import { getMyApplications } from "@/lib/applications/application-list-queries";

export default async function ApplicationsPage() {
  const session = await requireMemberPage();
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: applicationQueryKeys.mine(),
    queryFn: () => getMyApplications(session.user.id),
    staleTime: 30_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyApplications />
    </HydrationBoundary>
  );
}
