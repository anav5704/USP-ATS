import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getCachedSession } from "@/lib/auth-session";
import { ApprovalList } from "@/components/jobs/approvals/approval-list";
import { getQueryClient } from "@/lib/get-query-client";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import { getApprovals } from "@/lib/jobs/approval-queries";

export default async function ApprovalsPage() {
  const session = await getCachedSession();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/access-denied");

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: jobQueryKeys.approvals(),
    queryFn: () => getApprovals(session.user.id),
    staleTime: 30_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApprovalList />
    </HydrationBoundary>
  );
}
