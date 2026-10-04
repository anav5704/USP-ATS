import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getCachedSession } from "@/lib/auth-session";
import { ApprovalList } from "@/components/jobs/approvals/approval-list";
import { getQueryClient } from "@/lib/get-query-client";
import { approvalsPageOptions } from "@/lib/jobs/job-query-options";
import { EMPTY_APPROVAL_QUERY_FILTERS } from "@/lib/jobs/approval-filters";
import { getApprovalPage } from "@/lib/jobs/approval-queries";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";

export default async function ApprovalsPage() {
  const session = await getCachedSession();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/access-denied");

  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      ...approvalsPageOptions(EMPTY_APPROVAL_QUERY_FILTERS, "mine", 1),
      queryFn: () =>
        getApprovalPage(
          session.user.id,
          EMPTY_APPROVAL_QUERY_FILTERS,
          "mine",
          1,
          ADMIN_PAGE_SIZE
        ),
    }),
    queryClient.prefetchQuery({
      ...approvalsPageOptions(EMPTY_APPROVAL_QUERY_FILTERS, "review", 1),
      queryFn: () =>
        getApprovalPage(
          session.user.id,
          EMPTY_APPROVAL_QUERY_FILTERS,
          "review",
          1,
          ADMIN_PAGE_SIZE
        ),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApprovalList />
    </HydrationBoundary>
  );
}
